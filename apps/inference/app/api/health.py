from fastapi import APIRouter

from app.models.health import StatusResponse

router = APIRouter()


@router.get('/healthz', response_model=StatusResponse)
def healthz() -> StatusResponse:
    return StatusResponse(status='ok')


@router.get('/readyz', response_model=StatusResponse)
def readyz() -> StatusResponse:
    return StatusResponse(status='ready')
