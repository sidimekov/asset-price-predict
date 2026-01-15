from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List

import numpy as np
from catboost import CatBoostRegressor
from sklearn.metrics import mean_absolute_error

from feature_dataset import FEATURE_COLUMNS, load_split, zscore_apply, zscore_stats


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
    parser = argparse.ArgumentParser(description="Train CatBoost multi-horizon model.")
    parser.add_argument(
        "--data-dirs",
        default="data/features/v1/binance",
        type=_parse_dirs,
        help="Comma-separated feature directories.",
    )
    parser.add_argument("--out-dir", default="data/models/v1/catboost")
    parser.add_argument("--model-name", default="forecast_catboost_v1")
    parser.add_argument("--random-state", type=int, default=7)
    parser.add_argument("--iterations", type=int, default=600)
    parser.add_argument("--depth", type=int, default=7)
    parser.add_argument("--learning-rate", type=float, default=0.05)
    parser.add_argument("--max-rows", type=int, default=None)
    args = parser.parse_args()

    train = load_split(args.data_dirs, "train", max_rows=args.max_rows)
    val = load_split(args.data_dirs, "val", max_rows=args.max_rows)

    mean, std = zscore_stats(train.X)
    X_train = zscore_apply(train.X, mean, std)
    X_val = zscore_apply(val.X, mean, std)

    model = CatBoostRegressor(
        loss_function="MultiRMSE",
        iterations=args.iterations,
        depth=args.depth,
        learning_rate=args.learning_rate,
        random_seed=args.random_state,
        verbose=200,
        allow_writing_files=False,
    )
    model.fit(X_train, train.y, eval_set=(X_val, val.y))

    val_pred = model.predict(X_val)
    metrics = evaluate(val.y, val_pred, val.last_close)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / f"{args.model_name}.cbm"
    model.save_model(model_path)

    meta = {
        "model_name": args.model_name,
        "features": FEATURE_COLUMNS,
        "target_columns": train.target_columns,
        "normalization": {"type": "zscore", "mean": mean.tolist(), "std": std.tolist()},
        "metrics": metrics,
        "splits": {"train": len(train.X), "val": len(val.X)},
        "data_dirs": [str(p) for p in args.data_dirs],
        "params": {
            "iterations": args.iterations,
            "depth": args.depth,
            "learning_rate": args.learning_rate,
            "random_state": args.random_state,
        },
    }
    meta_path = out_dir / f"{args.model_name}.meta.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=True, indent=2))

    print(f"[catboost] saved model -> {model_path}")
    print(f"[catboost] metrics -> {meta_path}")


if __name__ == "__main__":
    main()
