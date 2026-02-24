# Inference service

Минимальный сервис инференса на FastAPI.

## Локальный запуск

```bash
cd apps/inference
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoint'ы

- `GET /healthz`
- `GET /readyz`
- `POST /v1/predict`

Проверка:

```bash
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz
curl -X POST http://localhost:8000/v1/predict \
  -H 'Content-Type: application/json' \
  -d '{
    "symbol": "SBER",
    "timeframe": "1d",
    "horizon": 7,
    "inputUntil": "2025-01-31T12:00:00Z",
    "model": "forecast-lgbm-v1"
  }'
```

OpenAPI доступен по `http://localhost:8000/docs` и `http://localhost:8000/openapi.json`.
