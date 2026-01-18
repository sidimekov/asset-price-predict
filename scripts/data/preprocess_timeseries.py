#!/usr/bin/env python3
import argparse
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


MSK_TZ = timezone(timedelta(hours=3))


def _parse_moex_begin(value: str) -> int:
    # MOEX returns local exchange time; treat as MSK and convert to UTC.
    dt = datetime.fromisoformat(value.replace(" ", "T"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=MSK_TZ)
    dt_utc = dt.astimezone(timezone.utc)
    return int(dt_utc.timestamp() * 1000)


def _normalize_bar(ts: int, o: Any, h: Any, l: Any, c: Any, v: Any) -> Optional[List[Any]]:
    try:
        ts = int(ts)
        o = float(o)
        h = float(h)
        l = float(l)
        c = float(c)
        v = None if v is None else float(v)
    except (TypeError, ValueError):
        return None

    if not (o == o and h == h and l == l and c == c):
        return None
    if h < max(o, c) or l > min(o, c):
        return None
    if v is not None and v < 0:
        return None
    return [ts, o, h, l, c, v] if v is not None else [ts, o, h, l, c]


def _normalize_bars(bars: Iterable[List[Any]]) -> List[List[Any]]:
    normalized: List[List[Any]] = []
    for b in bars:
        if len(b) < 5:
            continue
        ts, o, h, l, c = b[:5]
        v = b[5] if len(b) > 5 else None
        out = _normalize_bar(ts, o, h, l, c, v)
        if out:
            normalized.append(out)

    # Normalize to ms timestamps and sort/unique by ts
    ms_bars: List[List[Any]] = []
    for b in normalized:
        ts = int(b[0])
        ts_ms = ts * 1000 if ts < 1_000_000_000_000 else ts
        ms_bars.append([ts_ms] + b[1:])

    ms_bars.sort(key=lambda x: x[0])
    deduped: List[List[Any]] = []
    last_ts = -1
    for b in ms_bars:
        if b[0] <= last_ts:
            continue
        deduped.append(b)
        last_ts = b[0]
    return deduped


def _read_raw(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text())


def _to_bars(raw: Dict[str, Any]) -> List[List[Any]]:
    source = raw.get("source")
    data = raw.get("data", [])
    bars: List[List[Any]] = []

    if source == "MOEX":
        for row in data:
            # [begin, open, high, low, close, volume]
            if len(row) < 6:
                continue
            ts = _parse_moex_begin(row[0])
            bars.append([ts, row[1], row[2], row[3], row[4], row[5]])
        return _normalize_bars(bars)

    if source == "BINANCE":
        for row in data:
            # kline: [openTime, open, high, low, close, volume, ...]
            if len(row) < 6:
                continue
            bars.append([row[0], row[1], row[2], row[3], row[4], row[5]])
        return _normalize_bars(bars)

    # Fallback: treat raw["data"] as already bars
    if isinstance(data, list):
        return _normalize_bars(data)
    return []


def _iter_json_files(root: Path) -> Iterable[Path]:
    if root.is_file():
        yield root
        return
    for path in root.rglob("*.json"):
        if path.is_file():
            yield path


def preprocess(in_path: Path, out_dir: Path) -> None:
    files = list(_iter_json_files(in_path))
    if not files:
        print(f"[preprocess] no json files found in {in_path}")
        return
    for src in files:
        raw = _read_raw(src)
        bars = _to_bars(raw)
        rel = src.name
        dest = out_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(bars, ensure_ascii=True))
        print(f"[preprocess] {src} -> {dest} ({len(bars)} bars)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize raw MOEX/Binance candles to shared Bar format."
    )
    parser.add_argument("--in-path", required=True)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    preprocess(Path(args.in_path), Path(args.out_dir))


if __name__ == "__main__":
    main()
