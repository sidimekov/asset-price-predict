from fastapi import FastAPI

from app.api.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(title='Asset Price Predict Inference', version='0.1.0')
    app.include_router(health_router)
    return app
