from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Timeframe = Literal['1h', '8h', '1d', '7d', '1mo']


def validate_forecast_series_invariants(
    *,
    p10: list[float],
    p50: list[float],
    p90: list[float],
    t: list[int],
    require_non_empty: bool = True,
) -> None:
    lengths = {len(p10), len(p50), len(p90), len(t)}
    if len(lengths) != 1:
        raise ValueError('p10, p50, p90 and t must have equal length')

    if require_non_empty and len(p10) == 0:
        raise ValueError('series arrays must not be empty')

    for idx, (low, median, high) in enumerate(zip(p10, p50, p90)):
        if not (low <= median <= high):
            raise ValueError(f'quantile order violated at index {idx}: expected p10 <= p50 <= p90')

    if any(ts <= 0 for ts in t):
        raise ValueError('timestamps must be positive Unix milliseconds')


class PredictInput(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=32)
    timeframe: Timeframe
    horizon: int = Field(..., ge=1, le=500)
    model: str = Field(..., min_length=1, max_length=128)
    input_until: datetime | None = None

    @field_validator('symbol')
    @classmethod
    def validate_symbol(cls, value: str) -> str:
        symbol = value.strip().upper()
        if not symbol:
            raise ValueError('symbol must not be empty')
        return symbol


class ForecastSeries(BaseModel):
    p10: list[float]
    p50: list[float]
    p90: list[float]
    t: list[int] = Field(..., description='Unix timestamp в миллисекундах')

    @model_validator(mode='after')
    def validate_invariants(self) -> 'ForecastSeries':
        validate_forecast_series_invariants(
            p10=self.p10,
            p50=self.p50,
            p90=self.p90,
            t=self.t,
            require_non_empty=True,
        )
        return self


class PredictOutput(BaseModel):
    series: ForecastSeries
    model_id: str = Field(..., min_length=1, max_length=128)
    model_version: str = Field(..., min_length=1, max_length=64)
    duration_ms: int = Field(..., ge=0)
