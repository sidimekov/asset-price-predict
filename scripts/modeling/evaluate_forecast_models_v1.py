from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import numpy as np
from catboost import CatBoostRegressor
from joblib import load
from sklearn.metrics import mean_absolute_error, mean_squared_error

from feature_dataset import load_split, zscore_apply


def _parse_dirs(value: str) -> List[Path]:
    return [Path(v.strip()) for v in value.split(",") if v.strip()]


def _load_meta(path: Path) -> Dict[str, object]:
    return json.loads(path.read_text())


def _normalize(X: np.ndarray, meta: Dict[str, object]) -> np.ndarray:
    norm = meta.get("normalization") or {}
    mean = np.asarray(norm.get("mean", []), dtype=np.float32)
    std = np.asarray(norm.get("std", []), dtype=np.float32)
    if mean.size == 0 or std.size == 0:
        return X
    return zscore_apply(X, mean, std)


def _select_targets(
    split_targets: List[str],
    wanted_targets: Iterable[str],
    y: np.ndarray,
) -> Tuple[np.ndarray, List[str]]:
    indices: List[int] = []
    names: List[str] = []
    for name in wanted_targets:
        if name not in split_targets:
            raise ValueError(f"Target {name} not found in dataset targets")
        indices.append(split_targets.index(name))
        names.append(name)
    return y[:, indices], names


def _mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = np.maximum(np.abs(y_true), 1e-6)
    return float(np.mean(np.abs((y_true - y_pred) / denom)))


def _metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    last_close: np.ndarray,
) -> Dict[str, object]:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))

    if y_true.ndim == 1:
        p50_true = y_true + last_close
        p50_pred = y_pred + last_close
    else:
        p50_true = y_true + last_close[:, None]
        p50_pred = y_pred + last_close[:, None]

    mape_price = _mape(p50_true, p50_pred)

    out: Dict[str, object] = {
        "mae_delta": mae,
        "rmse_delta": rmse,
        "mape_price": mape_price,
    }

    if y_true.ndim == 2:
        per_horizon = []
        for idx in range(y_true.shape[1]):
            h_mae = float(mean_absolute_error(y_true[:, idx], y_pred[:, idx]))
            h_rmse = float(
                np.sqrt(mean_squared_error(y_true[:, idx], y_pred[:, idx]))
            )
            h_mape = _mape(
                y_true[:, idx] + last_close,
                y_pred[:, idx] + last_close,
            )
            per_horizon.append({"mae_delta": h_mae, "rmse_delta": h_rmse, "mape_price": h_mape})
        out["per_horizon"] = per_horizon

    return out


def _baseline(y_shape: Tuple[int, ...]) -> np.ndarray:
    return np.zeros(y_shape, dtype=np.float32)


def evaluate_lgbm(
    model_path: Path,
    meta_path: Path,
    X: np.ndarray,
    y: np.ndarray,
    last_close: np.ndarray,
    target_columns: List[str],
) -> Dict[str, object]:
    meta = _load_meta(meta_path)
    Xn = _normalize(X, meta)
    model = load(model_path)
    pred = model.predict(Xn)
    pred = np.asarray(pred, dtype=np.float32)

    metrics = _metrics(y, pred, last_close)
    baseline = _metrics(y, _baseline(y.shape), last_close)
    return {
        "model": "lgbm",
        "targets": target_columns,
        "metrics": metrics,
        "baseline": baseline,
    }


def evaluate_catboost(
    model_path: Path,
    meta_path: Path,
    X: np.ndarray,
    y: np.ndarray,
    last_close: np.ndarray,
    split_targets: List[str],
) -> Dict[str, object]:
    meta = _load_meta(meta_path)
    wanted = meta.get("target_columns") or []
    if not wanted:
        raise ValueError("CatBoost meta has no target_columns")

    y_sel, target_columns = _select_targets(split_targets, wanted, y)
    y_sel = y_sel[:, 0]
    Xn = _normalize(X, meta)

    model = CatBoostRegressor()
    model.load_model(model_path)
    pred = model.predict(Xn)
    pred = np.asarray(pred, dtype=np.float32).reshape(-1)

    metrics = _metrics(y_sel, pred, last_close)
    baseline = _metrics(y_sel, _baseline(y_sel.shape), last_close)
    return {
        "model": "catboost",
        "targets": target_columns,
        "metrics": metrics,
        "baseline": baseline,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate v1 forecast models on the test split."
    )
    parser.add_argument(
        "--data-dirs",
        default="data/features/v1/binance",
        type=_parse_dirs,
        help="Comma-separated feature directories.",
    )
    parser.add_argument(
        "--split",
        default="test",
        choices=["train", "val", "test"],
    )
    parser.add_argument(
        "--lgbm-model",
        default="data/models/v1/lgbm/forecast_lgbm_v1.joblib",
    )
    parser.add_argument(
        "--lgbm-meta",
        default="data/models/v1/lgbm/forecast_lgbm_v1.meta.json",
    )
    parser.add_argument(
        "--cat-model",
        default="data/models/v1/catboost/forecast_catboost_v1.cbm",
    )
    parser.add_argument(
        "--cat-meta",
        default="data/models/v1/catboost/forecast_catboost_v1.meta.json",
    )
    parser.add_argument(
        "--out",
        default="docs/modeling/model_metrics_v1.json",
    )
    parser.add_argument("--skip-lgbm", action="store_true")
    parser.add_argument("--skip-cat", action="store_true")
    args = parser.parse_args()

    print(f"[metrics] loading split={args.split} from {args.data_dirs}")
    split = load_split(args.data_dirs, args.split)
    print(
        f"[metrics] loaded rows={split.X.shape[0]} targets={len(split.target_columns)}"
    )
    results: Dict[str, object] = {
        "split": args.split,
        "rows": int(split.X.shape[0]),
        "targets": split.target_columns,
        "models": [],
    }

    if not args.skip_lgbm:
        print(f"[metrics] evaluating lgbm model={args.lgbm_model}")
        results["models"].append(
            evaluate_lgbm(
                Path(args.lgbm_model),
                Path(args.lgbm_meta),
                split.X,
                split.y,
                split.last_close,
                split.target_columns,
            )
        )

    if not args.skip_cat:
        print(f"[metrics] evaluating catboost model={args.cat_model}")
        results["models"].append(
            evaluate_catboost(
                Path(args.cat_model),
                Path(args.cat_meta),
                split.X,
                split.y,
                split.last_close,
                split.target_columns,
            )
        )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(results, ensure_ascii=True, indent=2))

    print(f"[metrics] saved -> {out_path}")
    for entry in results["models"]:
        name = entry["model"]
        mae = entry["metrics"]["mae_delta"]
        mape = entry["metrics"]["mape_price"]
        print(f"[metrics] {name}: mae_delta={mae:.4f}, mape_price={mape:.4f}")


if __name__ == "__main__":
    main()
