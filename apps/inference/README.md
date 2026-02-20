# Inference service

Минимальный сервис инференса на FastAPI

## Локальный запуск

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd apps/inference
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Проверка endpoint'ов:

```bash
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz
```
