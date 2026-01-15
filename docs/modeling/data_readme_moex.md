# Датасет MOEX v1

## Источник

- MOEX ISS
- Engine: `stock`
- Market: `shares`
- Эндпойнт: `/iss/engines/stock/markets/shares/securities/{TICKER}/candles.json`

## Параметры выгрузки (фиксированные)

- Тикеры: `SBER`, `GAZP`, `LKOH`, `GMKN`, `NVTK`
- Интервал: `24` (1d)
- From: `2019-01-01`
- Till: `2024-12-31`
- Колонки: `begin,open,high,low,close,volume`
- Прочее: `iss.only=candles`

## Формат raw

JSON на тикер + TF:

```json
{
  "source": "MOEX",
  "ticker": "SBER",
  "timeframe": "1d",
  "from": "2019-01-01",
  "till": "2024-12-31",
  "interval": 24,
  "fetched_at": "2024-01-01T00:00:00Z",
  "data": [...]
}
```

Файлы: `data/raw/moex/{TICKER}_1d.json`

## Нормализация

Скрипт `scripts/data/preprocess_timeseries.py`:

- преобразует `begin` (локальное время MOEX) в UTC epoch ms
- проверяет валидность OHLC
- сортирует и удаляет дубликаты
- выравнивает по TF и заполняет пропуски (close=prev_close, volume=0)

Нормализованные бары: `data/normalized/moex/{TICKER}_1d.json`

## Пример запуска

```bash
python scripts/data/fetch_moex.py \
  --tickers SBER,GAZP,LKOH,GMKN,NVTK \
  --from 2019-01-01 --till 2024-12-31 \
  --interval 24 --out-dir data/raw/moex
```
