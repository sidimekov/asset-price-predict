#!/usr/bin/env python3
import argparse
import csv
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from math import log, sqrt
from pathlib import Path
from typing import Iterable, List, Dict, Any, Optional, Tuple


@dataclass
class FeatureConfig:
    ema_span: int = 10
    vol_window: int = 20
    horizon: int = 5
    target: str = "log_return"  # or "delta_price"


FEATURE_COLUMNS = [
    "close_lag_1",
    "close_lag_3",
    "close_lag_5",
    "log_return",
    "ema",
    "rolling_vol",
    "day_of_week",
    "month",
]


def _read_bars(path: Path) -> List[List[Any]]:
    return json.loads(path.read_text())


def _ema_series(values: List[float], span: int) -> List[float]:
    if not values:
        return []
    alpha = 2 / (span + 1)
    ema_vals = [values[0]]
    for v in values[1:]:
        ema_vals.append(alpha * v + (1 - alpha) * ema_vals[-1])
    return ema_vals


def _log_return(prev: float, curr: float) -> float:
    if prev <= 0 or curr <= 0:
        return 0.0
    return log(curr / prev)


def _rolling_std(values: List[float], window: int) -> List[Optional[float]]:
    out: List[Optional[float]] = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        w = values[start : i + 1]
        if len(w) < window:
            out.append(None)
            continue
        mean = sum(w) / window
        var = sum((v - mean) ** 2 for v in w) / window
        out.append(sqrt(var))
    return out


def _time_parts(ts_ms: int) -> Tuple[int, int]:
    dt = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
    return dt.weekday(), dt.month


def _iter_json_files(root: Path) -> Iterable[Path]:
    if root.is_file():
        yield root
        return
    for path in root.rglob("*.json"):
        if path.is_file():
            yield path


def _target_value(closes: List[float], idx: int, cfg: FeatureConfig) -> float:
    future_idx = idx + cfg.horizon
    if cfg.target == "delta_price":
        return closes[future_idx] - closes[idx]
    # forward log-return: log(close[t+H] / close[t])
    return _log_return(closes[idx], closes[future_idx])


def build_features_for_bars(
    bars: List[List[Any]], cfg: FeatureConfig
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    closes = [float(b[4]) for b in bars]
    timestamps = [int(b[0]) for b in bars]

    log_returns = [0.0]
    for i in range(1, len(closes)):
        log_returns.append(_log_return(closes[i - 1], closes[i]))

    ema_vals = _ema_series(closes, cfg.ema_span)
    vol_vals = _rolling_std(log_returns, cfg.vol_window)

    min_idx = max(5, 1, cfg.ema_span, cfg.vol_window)
    rows: List[Dict[str, Any]] = []
    for i in range(min_idx, len(closes) - cfg.horizon):
        if vol_vals[i] is None:
            continue
        dow, month = _time_parts(timestamps[i])
        row = {
            "ts": timestamps[i],
            "close": closes[i],
            "close_lag_1": closes[i - 1],
            "close_lag_3": closes[i - 3],
            "close_lag_5": closes[i - 5],
            "log_return": log_returns[i],
            "ema": ema_vals[i],
            "rolling_vol": vol_vals[i],
            "day_of_week": dow,
            "month": month,
            "target": _target_value(closes, i, cfg),
        }
        rows.append(row)

    meta = {
        "rows": len(rows),
        "horizon": cfg.horizon,
        "target": cfg.target,
        "ema_span": cfg.ema_span,
        "vol_window": cfg.vol_window,
        "features": FEATURE_COLUMNS,
    }
    return rows, meta


def _write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
    fieldnames = ["ts", "close"] + FEATURE_COLUMNS + ["target"]
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _split_rows(rows: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    n = len(rows)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)
    return rows[:train_end], rows[train_end:val_end], rows[val_end:]


def process_file(path: Path, out_dir: Path, cfg: FeatureConfig) -> None:
    bars = _read_bars(path)
    rows, meta = build_features_for_bars(bars, cfg)
    train, val, test = _split_rows(rows)

    stem = path.stem
    out_dir.mkdir(parents=True, exist_ok=True)
    _write_csv(out_dir / f"{stem}_train.csv", train)
    _write_csv(out_dir / f"{stem}_val.csv", val)
    _write_csv(out_dir / f"{stem}_test.csv", test)

    meta_out = {
        **meta,
        "source": str(path),
        "splits": {"train": len(train), "val": len(val), "test": len(test)},
    }
    (out_dir / f"{stem}_meta.json").write_text(json.dumps(meta_out, ensure_ascii=True))
    print(f"[features] {path} -> {out_dir} ({meta_out['rows']} rows)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build features/targets and time-based splits from normalized bars."
    )
    parser.add_argument("--bars", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--ema-span", type=int, default=10)
    parser.add_argument("--vol-window", type=int, default=20)
    parser.add_argument("--horizon", type=int, default=5)
    parser.add_argument("--target", choices=["log_return", "delta_price"], default="log_return")
    args = parser.parse_args()

    cfg = FeatureConfig(
        ema_span=args.ema_span,
        vol_window=args.vol_window,
        horizon=args.horizon,
        target=args.target,
    )

    files = list(_iter_json_files(Path(args.bars)))
    if not files:
        print(f"[features] no json files found in {args.bars}")
        return
    for path in files:
        process_file(path, Path(args.out_dir), cfg)


if __name__ == "__main__":
    main()
