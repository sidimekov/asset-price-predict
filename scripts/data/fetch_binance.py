#!/usr/bin/env python3
import argparse
import json
import ssl
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Dict, Any, Optional
from urllib.parse import urlencode
from urllib.request import urlopen


BINANCE_BASE = "https://api.binance.com"


def _fetch_json(url: str, ssl_ctx: Optional[ssl.SSLContext]) -> Any:
    with urlopen(url, context=ssl_ctx) as resp:
        data = resp.read()
    return json.loads(data.decode("utf-8"))


def _build_url(params: Dict[str, Any]) -> str:
    query = urlencode(params)
    return f"{BINANCE_BASE}/api/v3/klines?{query}"


def _parse_iso(s: str) -> datetime:
    dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _interval_ms(interval: str) -> int:
    if interval.endswith("m"):
        return int(interval[:-1]) * 60_000
    if interval.endswith("h"):
        return int(interval[:-1]) * 3_600_000
    if interval.endswith("d"):
        return int(interval[:-1]) * 86_400_000
    raise ValueError(f"Unsupported interval: {interval}")


def _iter_klines(
    symbol: str,
    interval: str,
    start_ms: int,
    end_ms: int,
    limit: int,
    ssl_ctx: Optional[ssl.SSLContext],
) -> Iterable[List[Any]]:
    cursor = start_ms
    step = _interval_ms(interval)

    while cursor <= end_ms:
        params = {
            "symbol": symbol,
            "interval": interval,
            "startTime": cursor,
            "endTime": end_ms,
            "limit": limit,
        }
        url = _build_url(params)
        rows = _fetch_json(url, ssl_ctx)
        if not rows:
            break
        yield rows
        last_open = rows[-1][0]
        cursor = last_open + step
        if len(rows) < limit:
            break
        time.sleep(0.2)


def fetch_binance(
    symbols: Iterable[str],
    interval: str,
    date_from: str,
    date_till: str,
    out_dir: Path,
    ssl_ctx: Optional[ssl.SSLContext],
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    start_ms = int(_parse_iso(date_from).timestamp() * 1000)
    end_ms = int(_parse_iso(date_till).timestamp() * 1000)
    fetched_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    for symbol in symbols:
        rows: List[Any] = []
        for page in _iter_klines(
            symbol, interval, start_ms, end_ms, 1000, ssl_ctx
        ):
            rows.extend(page)

        payload = {
            "source": "BINANCE",
            "symbol": symbol,
            "interval": interval,
            "from": date_from,
            "till": date_till,
            "fetched_at": fetched_at,
            "data": rows,
        }
        dest = out_dir / f"{symbol}_{interval}.json"
        dest.write_text(json.dumps(payload, ensure_ascii=True))
        print(f"[binance] {symbol} {interval}: {len(rows)} rows -> {dest}")


def _parse_list(value: str) -> List[str]:
    return [v.strip().upper() for v in value.split(",") if v.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch raw Binance klines and store JSON per symbol/timeframe."
    )
    parser.add_argument("--symbols", required=True, type=_parse_list)
    parser.add_argument("--interval", default="1h")
    parser.add_argument("--from", dest="date_from", required=True)
    parser.add_argument("--till", dest="date_till", required=True)
    parser.add_argument("--out-dir", default="data/raw/binance")
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable TLS verification (use only if you trust the network).",
    )
    args = parser.parse_args()

    ssl_ctx: Optional[ssl.SSLContext] = None
    if args.insecure:
        ssl_ctx = ssl._create_unverified_context()

    fetch_binance(
        symbols=args.symbols,
        interval=args.interval,
        date_from=args.date_from,
        date_till=args.date_till,
        out_dir=Path(args.out_dir),
        ssl_ctx=ssl_ctx,
    )


if __name__ == "__main__":
    main()
