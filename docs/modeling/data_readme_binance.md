# Датасет Binance v1

## Источник

- Binance Public API
- Эндпойнт: `https://api.binance.com/api/v3/klines`

## Параметры выгрузки (фиксированные)

- Пары: `BTCUSDT`, `ETHUSDT`, `BNBUSDT`
- Интервал: `1h` (основной TF), `1d` (опционально)
- From: `2019-01-01T00:00:00Z`
- Till: `2024-12-31T00:00:00Z`
- Limit: `1000` (пагинация по `startTime`)

## Формат raw

```json
{
  "source": "BINANCE",
  "symbol": "BTCUSDT",
  "interval": "1h",
  "from": "2019-01-01T00:00:00Z",
  "till": "2024-12-31T00:00:00Z",
  "fetched_at": "2024-01-01T00:00:00Z",
  "data": [...]
}
```

Файлы: `data/raw/binance/{SYMBOL}_{TF}.json`

## Нормализация

Скрипт `scripts/data/preprocess_timeseries.py`:

- использует `openTime` как `ts`
- приводит timestamp к UTC epoch ms
- проверяет валидность OHLC
- сортирует и удаляет дубликаты
- выравнивает по TF и заполняет пропуски (close=prev_close, volume=0)

Нормализованные бары: `data/normalized/binance/{SYMBOL}_{TF}.json`

## Пример запуска

```bash
python scripts/data/fetch_binance.py \
  --symbols BTCUSDT,ETHUSDT,BNBUSDT \
  --from 2019-01-01T00:00:00Z --till 2024-12-31T00:00:00Z \
  --interval 1h --out-dir data/raw/binance
```
