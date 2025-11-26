# Минимальная модель прогноза (client-side)

Модель обучена на синтетическом временном ряде (случайные блуждания + небольшой тренд), предсказывает дельту цены на 24 шага вперёд и рассчитана на браузерный инференс через onnxruntime-web

Опорные артефакты:

- `apps/web/public/models/forecast_minimal.onnx` и `forecast_minimal.quant.onnx`
- контрольные суммы в `.sha256`
- манифест `apps/web/src/config/ml.manifest.json` (используется в `ml.ts`)
- тест-вектора `docs/modeling/test_vectors.json`

## Как воспроизвести обучение/экспорт

```bash
python -m venv .venv
.venv/bin/pip install numpy==1.26.4 scikit-learn==1.4.2 skl2onnx==1.16.0 onnx==1.16.1 onnxruntime==1.17.1
.venv/bin/python scripts/train_forecast_minimal.py
```

Скрипт заново сгенерирует синтетические данные, обучит модель, экспортирует ONNX, пересчитает sha256 и обновит `ml.manifest.json` + `docs/modeling/test_vectors.json`.

## Данные и признаки

- Источник данных - синтетический ряд, подробности в `docs/modeling/data_readme.md`
- Признаки (порядок фиксирован!!!): `last_close`, `mean_5`, `mean_20`, `std_20`, `momentum_3`, `momentum_8`, `ema_5`, `ema_10`, `ret_mean_5`, `ret_std_20`.
- Нормализация: z-score по усреднению/стандартному отклонению трейн части (`epsilon=1e-6`), параметры лежат в `ml.manifest.json`.

## Модель и постпроцесс

- Алгоритм: `LinearRegression` из sklearn
- Экспорт: `skl2onnx`. Квантованная версия строится через `onnxruntime.quantization.quantize_dynamic`.
- Постпроцесс в ML worker: `p50 = last_close + delta`, `p10/p90 = p50 ±1%` (фиксированная вилка для совместимости).
- Метрика на валидации (MAPE): см. `val_metrics.mape` в манифесте.

## Контроль и CI

- `scripts/check_model_artifacts.mjs` проверяет существование моделей и совпадение sha256 из `ml.manifest.json`, валидирует наличие `test_vectors.json`.
- Шаг в `.github/workflows/unit-tests.yml` запускает `pnpm verify:model`.

## Как обновить версию

1. Запустить скрипт обучения, он пересчитает `ml.manifest.json` и sha256.
2. Обновить `modelVer` в манифесте (например, `min-0-1-1`) и при необходимости в UI.
3. Закоммитить новые ONNX файлы + sha.


