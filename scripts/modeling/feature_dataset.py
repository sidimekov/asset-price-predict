from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

import numpy as np

FEATURE_COLUMNS = [
    "last_close",
    "mean_5",
    "mean_20",
    "std_20",
    "momentum_3",
    "momentum_8",
    "ema_5",
    "ema_10",
    "ret_mean_5",
    "ret_std_20",
]


@dataclass
class DatasetSplit:
    X: np.ndarray
    y: np.ndarray
    last_close: np.ndarray
    target_columns: List[str]


def _parse_target_columns(columns: Sequence[str]) -> List[str]:
    targets = [c for c in columns if c.startswith("target_")]
    if not targets:
        raise ValueError("No target_* columns found in feature CSV.")
    targets.sort(key=lambda k: int(k.split("_", 1)[1]))
    return targets


def _iter_feature_files(data_dirs: Iterable[Path], split: str) -> Iterable[Path]:
    suffix = f"_{split}.csv"
    for root in data_dirs:
        if root.is_file() and root.name.endswith(suffix):
            yield root
            continue
        for path in root.rglob(f"*{suffix}"):
            if path.is_file():
                yield path


def _load_csv(path: Path) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str]]:
    with path.open() as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError(f"Missing header in {path}")
        target_columns = _parse_target_columns(reader.fieldnames)

        X_rows: List[List[float]] = []
        y_rows: List[List[float]] = []
        last_close: List[float] = []
        for row in reader:
            X_rows.append([float(row[col]) for col in FEATURE_COLUMNS])
            y_rows.append([float(row[col]) for col in target_columns])
            last_close.append(float(row.get("last_close") or row.get("close") or 0.0))

    return (
        np.asarray(X_rows, dtype=np.float32),
        np.asarray(y_rows, dtype=np.float32),
        np.asarray(last_close, dtype=np.float32),
        target_columns,
    )


def load_split(
    data_dirs: Iterable[Path], split: str, max_rows: int | None = None
) -> DatasetSplit:
    X_list: List[np.ndarray] = []
    y_list: List[np.ndarray] = []
    last_close_list: List[np.ndarray] = []
    target_columns: List[str] | None = None

    for path in _iter_feature_files(data_dirs, split):
        X, y, last_close, targets = _load_csv(path)
        if target_columns is None:
            target_columns = targets
        elif target_columns != targets:
            raise ValueError(f"Target columns mismatch in {path}")

        if max_rows is not None and len(X) > max_rows:
            X = X[:max_rows]
            y = y[:max_rows]
            last_close = last_close[:max_rows]

        X_list.append(X)
        y_list.append(y)
        last_close_list.append(last_close)

    if not X_list:
        raise FileNotFoundError(f"No feature files found for split={split}")

    X_all = np.concatenate(X_list, axis=0)
    y_all = np.concatenate(y_list, axis=0)
    last_close_all = np.concatenate(last_close_list, axis=0)
    return DatasetSplit(
        X=X_all,
        y=y_all,
        last_close=last_close_all,
        target_columns=target_columns or [],
    )


def zscore_stats(X: np.ndarray, epsilon: float = 1e-6) -> Tuple[np.ndarray, np.ndarray]:
    mean = X.mean(axis=0)
    std = X.std(axis=0) + epsilon
    return mean.astype(np.float32), std.astype(np.float32)


def zscore_apply(X: np.ndarray, mean: np.ndarray, std: np.ndarray) -> np.ndarray:
    return ((X - mean) / std).astype(np.float32)
