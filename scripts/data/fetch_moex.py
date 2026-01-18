#!/usr/bin/env python3
import argparse
import json
import ssl
import time
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Dict, Any, Optional
from urllib.parse import urlencode
from urllib.request import urlopen


MOEX_BASE = "https://iss.moex.com/iss"


def _fetch_json(url: str, ssl_ctx: Optional[ssl.SSLContext]) -> Dict[str, Any]:
    with urlopen(url, context=ssl_ctx) as resp:
        data = resp.read()
    return json.loads(data.decode("utf-8"))


def _build_url(ticker: str, params: Dict[str, Any]) -> str:
    query = urlencode(params)
    return (
        f"{MOEX_BASE}/engines/stock/markets/shares/"
        f"securities/{ticker}/candles.json?{query}"
    )


def _iter_pages(
    ticker: str,
    date_from: str,
    date_till: str,
    interval: int,
    page_size: int,
    ssl_ctx: Optional[ssl.SSLContext],
) -> Iterable[List[Any]]:
    start = 0
    while True:
        params = {
            "from": date_from,
            "till": date_till,
            "interval": interval,
            "iss.only": "candles",
            "candles.columns": "begin,open,high,low,close,volume",
            "start": start,
        }
        url = _build_url(ticker, params)
        payload = _fetch_json(url, ssl_ctx)
        rows = payload.get("candles", {}).get("data", [])
        if not rows:
            break
        yield rows
        if len(rows) < page_size:
            break
        start += page_size
        time.sleep(0.2)


def _timeframe_label(interval: int) -> str:
    if interval == 24:
        return "1d"
    return f"{interval}m"


def fetch_moex(
    tickers: Iterable[str],
    date_from: str,
    date_till: str,
    interval: int,
    out_dir: Path,
    ssl_ctx: Optional[ssl.SSLContext],
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    tf = _timeframe_label(interval)
    fetched_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    for ticker in tickers:
        rows: List[Any] = []
        for page in _iter_pages(
            ticker, date_from, date_till, interval, 100, ssl_ctx
        ):
            rows.extend(page)

        payload = {
            "source": "MOEX",
            "ticker": ticker,
            "timeframe": tf,
            "from": date_from,
            "till": date_till,
            "interval": interval,
            "fetched_at": fetched_at,
            "data": rows,
        }
        dest = out_dir / f"{ticker}_{tf}.json"
        dest.write_text(json.dumps(payload, ensure_ascii=True))
        print(f"[moex] {ticker} {tf}: {len(rows)} rows -> {dest}")


def _parse_list(value: str) -> List[str]:
    return [v.strip().upper() for v in value.split(",") if v.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch raw MOEX candles and store JSON per ticker/timeframe."
    )
    parser.add_argument("--tickers", required=True, type=_parse_list)
    parser.add_argument("--from", dest="date_from", required=True)
    parser.add_argument("--till", dest="date_till", required=True)
    parser.add_argument("--interval", type=int, default=24)
    parser.add_argument("--out-dir", default="data/raw/moex")
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable TLS verification (use only if you trust the network).",
    )
    args = parser.parse_args()

    ssl_ctx: Optional[ssl.SSLContext] = None
    if args.insecure:
        ssl_ctx = ssl._create_unverified_context()

    fetch_moex(
        tickers=args.tickers,
        date_from=args.date_from,
        date_till=args.date_till,
        interval=args.interval,
        out_dir=Path(args.out_dir),
        ssl_ctx=ssl_ctx,
    )


if __name__ == "__main__":
    main()
