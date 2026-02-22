from pydantic import BaseModel


class ApiError(BaseModel):
    code: str
    message: str
    details: list[dict] | None = None


class ErrorResponse(BaseModel):
    error: ApiError
