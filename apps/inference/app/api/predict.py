from fastapi import APIRouter, status

from app.models.error import ErrorResponse
from app.models.predict import (
    ForecastCreateRequest,
    PredictResponse,
    build_stub_prediction,
)

router = APIRouter(prefix="/v1", tags=["predict"])


@router.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    responses={
        422: {
            "model": ErrorResponse,
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "Request validation failed",
                            "details": [
                                {
                                    "field": "horizon",
                                    "message": "Input should be less than or equal to 500",
                                }
                            ],
                        }
                    }
                }
            },
        }
    },
    summary="Build price forecast",
)
def predict(payload: ForecastCreateRequest) -> PredictResponse:
    return build_stub_prediction(payload)
