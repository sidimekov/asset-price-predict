from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import List

import numpy as np
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.multioutput import MultiOutputRegressor
from joblib import dump

from feature_dataset import FEATURE_COLUMNS, load_split, zscore_apply, zscore_stats

ROOT = Path(__file__).resolve().parents[2]
MPL_DIR = ROOT / ".mplconfig"
MPL_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPL_DIR))


def _parse_dirs(value: str) -> List[Path]:
    return [Path(v.strip()) for v in value.split(",") if v.strip()]


def _mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = np.maximum(np.abs(y_true), 1e-6)
    return float(np.mean(np.abs((y_true - y_pred) / denom)))


def evaluate(
    y_true: np.ndarray, y_pred: np.ndarray, last_close: np.ndarray
) -> dict:
    p50_true = y_true + last_close[:, None]
    p50_pred = y_pred + last_close[:, None]
    return {
        "mae_delta": float(mean_absolute_error(y_true, y_pred)),
        "mape_price": _mape(p50_true, p50_pred),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train LGBM multi-horizon model.")
    parser.add_argument(
        "--data-dirs",
        default="data/features/v1/binance",
        type=_parse_dirs,
        help="Comma-separated feature directories.",
    )
    parser.add_argument("--out-dir", default="data/models/v1/lgbm")
    parser.add_argument("--model-name", default="forecast_lgbm_v1")
    parser.add_argument("--random-state", type=int, default=7)
    parser.add_argument("--n-estimators", type=int, default=400)
    parser.add_argument("--learning-rate", type=float, default=0.05)
    parser.add_argument("--max-depth", type=int, default=7)
    parser.add_argument("--num-leaves", type=int, default=63)
    parser.add_argument("--max-rows", type=int, default=None)
    args = parser.parse_args()

    train = load_split(args.data_dirs, "train", max_rows=args.max_rows)
    val = load_split(args.data_dirs, "val", max_rows=args.max_rows)

    mean, std = zscore_stats(train.X)
    X_train = zscore_apply(train.X, mean, std)
    X_val = zscore_apply(val.X, mean, std)

    base = LGBMRegressor(
        n_estimators=args.n_estimators,
        learning_rate=args.learning_rate,
        max_depth=args.max_depth,
        num_leaves=args.num_leaves,
        objective="regression",
        random_state=args.random_state,
    )
    model = MultiOutputRegressor(base, n_jobs=1)
    model.fit(X_train, train.y)

    val_pred = model.predict(X_val)
    metrics = evaluate(val.y, val_pred, val.last_close)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / f"{args.model_name}.joblib"
    dump(model, model_path)

    meta = {
        "model_name": args.model_name,
        "features": FEATURE_COLUMNS,
        "target_columns": train.target_columns,
        "normalization": {"type": "zscore", "mean": mean.tolist(), "std": std.tolist()},
        "metrics": metrics,
        "splits": {"train": len(train.X), "val": len(val.X)},
        "data_dirs": [str(p) for p in args.data_dirs],
        "params": {
            "n_estimators": args.n_estimators,
            "learning_rate": args.learning_rate,
            "max_depth": args.max_depth,
            "num_leaves": args.num_leaves,
            "random_state": args.random_state,
        },
    }
    meta_path = out_dir / f"{args.model_name}.meta.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=True, indent=2))

    print(f"[lgbm] saved model -> {model_path}")
    print(f"[lgbm] metrics -> {meta_path}")


if __name__ == "__main__":
    main()
