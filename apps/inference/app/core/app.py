from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.health import router as health_router
from app.api.predict import router as predict_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Asset Price Predict Inference",
        version="0.2.0",
        description="Inference API for asset price forecast",
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details = [
            {"field": ".".join(map(str, err["loc"])), "message": err["msg"]}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": details,
                }
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(exc.detail),
                    "details": None,
                }
            },
        )

    app.include_router(health_router)
    app.include_router(predict_router)
    return app
