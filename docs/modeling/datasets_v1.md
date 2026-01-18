# Датасеты v1 (MOEX + Binance)

## Цель

Минимальные, воспроизводимые датасеты OHLCV для обучения моделей (LightGBM / CatBoost) и экспорта в ONNX. Данные не коммитятся, в репозитории хранятся только скрипты и документация.

Обучение и экспорт моделей v1 держим в `scripts/` (без ноутбуков в `docs/`).

## Источники

- **MOEX ISS (акции)**: `engine=stock`, `market=shares`, дневные свечи `interval=24`
- **Binance (крипто)**: `/api/v3/klines`, интервалы `1h` (основной), `1d` (опционально)

## Период (фиксированный)

- **from**: `2019-01-01`
- **till**: `2024-12-31`

## Набор активов (v1)

**MOEX (акции)**:

- SBER
- GAZP
- LKOH
- GMKN
- NVTK

**Binance (крипто)**:

- BTCUSDT
- ETHUSDT
- BNBUSDT

## Формат данных

### Сырые данные (raw, локально, не в git)

Один файл = один актив + один TF. JSON с метаданными и массивом свечей.

### Нормализованные бары (единый формат)

Единый формат баров (см. `@assetpredict/shared`):

`[ts, open, high, low, close, volume?]`

Требования:

- `ts` в UTC epoch ms
- сортировка по времени
- без дубликатов
- валидная OHLC логика (`high >= max(open,close)`, `low <= min(open,close)`)
- volume >= 0 (если есть)
- выравнивание по TF: пропуски заполняются (close=prev_close, volume=0)

### Фичи (совпадают с ML Worker)

Порядок фиксирован:

1. `last_close`
2. `mean_5`
3. `mean_20`
4. `std_20`
5. `momentum_3`
6. `momentum_8`
7. `ema_5`
8. `ema_10`
9. `ret_mean_5`
10. `ret_std_20`

Feature window по умолчанию: `64` (как в ML Worker).

## Таргет и горизонт

- **Цель (target)**: `log_return(t+1..H)` или `delta_price(t+1..H)`
- **H** (горизонт): фиксированный, по умолчанию `24` (v1)

В `build_features.py` таргеты пишутся как колонки `target_1 ... target_H`.

## Метрики моделей (test split)

Тестовые метрики считаются скриптом `scripts/modeling/evaluate_forecast_models_v1.py`.

| Market  | Model    | MAE (delta) | MAPE (price) |
| ------- | -------- | ----------- | ------------ |
| Binance | LGBM     | 418.3649    | 0.0162       |
| Binance | CatBoost | 90.6853     | 0.0042       |
| MOEX    | LGBM     | 51.1975     | 0.0395       |
| MOEX    | CatBoost | 12.8648     | 0.0096       |

## Сплиты

Только разбиение по времени (time-based split):

- train: 70%
- val: 15%
- test: 15%

Границы и параметры фиксируются при генерации и сохраняются в `*_meta.json`.

## Скрипты (v1)

- `scripts/data/fetch_moex.py` — загрузка MOEX raw
- `scripts/data/fetch_binance.py` — загрузка Binance raw
- `scripts/data/preprocess_timeseries.py` — нормализация баров
- `scripts/data/build_features.py` — фичи/таргеты/сплиты

## Пример пайплайна

```bash
# 1) Raw
python scripts/data/fetch_moex.py \
  --tickers SBER,GAZP,LKOH,GMKN,NVTK \
  --from 2019-01-01 --till 2024-12-31 \
  --interval 24 --out-dir data/raw/moex

python scripts/data/fetch_binance.py \
  --symbols BTCUSDT,ETHUSDT,BNBUSDT \
  --from 2019-01-01T00:00:00Z --till 2024-12-31T00:00:00Z \
  --interval 1h --out-dir data/raw/binance

# 2) Normalize
python scripts/data/preprocess_timeseries.py \
  --in-path data/raw/moex --out-dir data/normalized/moex

python scripts/data/preprocess_timeseries.py \
  --in-path data/raw/binance --out-dir data/normalized/binance

# 3) Features
python scripts/data/build_features.py \
  --bars data/normalized/moex --out-dir data/features/v1/moex \
  --horizon 24 --target delta_price --feature-window 64

python scripts/data/build_features.py \
  --bars data/normalized/binance --out-dir data/features/v1/binance \
  --horizon 24 --target delta_price --feature-window 64
```
