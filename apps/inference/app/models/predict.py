from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator

Timeframe = Literal['1h', '8h', '1d', '7d', '1mo']


class ForecastCreateRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'symbol': 'SBER',
                'timeframe': '1d',
                'horizon': 14,
                'inputUntil': '2025-01-31T12:00:00Z',
                'model': 'forecast-lgbm-v1',
            }
        }
    )

    symbol: str = Field(..., min_length=1, max_length=32, examples=['SBER', 'BTCUSDT'])
    timeframe: Timeframe = Field(..., examples=['1h', '1d'])
    horizon: int = Field(..., ge=1, le=500, examples=[14])
    inputUntil: datetime | None = Field(default=None, examples=['2025-01-31T12:00:00Z'])
    model: str | None = Field(default=None, min_length=1, max_length=128, examples=['forecast-lgbm-v1'])

    @field_validator('symbol')
    @classmethod
    def validate_symbol(cls, value: str) -> str:
        symbol = value.strip().upper()
        if not symbol:
            raise ValueError('symbol must not be empty')
        return symbol


class ForecastSeries(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'p10': [295.1, 296.0, 296.4],
                'p50': [298.2, 299.0, 299.7],
                'p90': [302.9, 303.5, 304.1],
                't': [1738281600000, 1738368000000, 1738454400000],
            }
        }
    )

    p10: list[float]
    p50: list[float]
    p90: list[float]
    t: list[int] = Field(..., description='Unix timestamp в миллисекундах')

    @field_validator('p10', 'p50', 'p90', 't')
    @classmethod
    def validate_not_empty(cls, value: list[float] | list[int]) -> list[float] | list[int]:
        if len(value) == 0:
            raise ValueError('series arrays must not be empty')
        return value

    @field_validator('p90')
    @classmethod
    def validate_same_length(cls, p90: list[float], values) -> list[float]:
        p10 = values.data.get('p10')
        p50 = values.data.get('p50')
        if p10 is not None and len(p10) != len(p90):
            raise ValueError('p10, p50, p90 and t must have equal length')
        if p50 is not None and len(p50) != len(p90):
            raise ValueError('p10, p50, p90 and t must have equal length')
        return p90

    @field_validator('t')
    @classmethod
    def validate_timestamps(cls, timestamps: list[int], values) -> list[int]:
        length_ref = len(values.data.get('p90', []))
        if length_ref and len(timestamps) != length_ref:
            raise ValueError('p10, p50, p90 and t must have equal length')
        if any(ts <= 0 for ts in timestamps):
            raise ValueError('timestamps must be positive Unix milliseconds')
        return timestamps


class PredictResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'id': 'fcst_2ec9d3ea2c0e47d1b37742f121b56e6f',
                'symbol': 'SBER',
                'timeframe': '1d',
                'createdAt': '2025-01-31T12:00:00Z',
                'horizon': 14,
                'series': {
                    'p10': [295.1, 296.0, 296.4],
                    'p50': [298.2, 299.0, 299.7],
                    'p90': [302.9, 303.5, 304.1],
                    't': [1738281600000, 1738368000000, 1738454400000],
                },
                'model': 'forecast-lgbm-v1',
                'modelVersion': 'v1',
                'durationMs': 8,
            }
        }
    )

    id: str
    symbol: str
    timeframe: Timeframe
    createdAt: datetime
    horizon: int
    series: ForecastSeries
    model: str
    modelVersion: str
    durationMs: int = Field(..., ge=0)


def build_stub_prediction(payload: ForecastCreateRequest) -> PredictResponse:
    now = datetime.now(timezone.utc)
    step_ms = {
        '1h': 3_600_000,
        '8h': 28_800_000,
        '1d': 86_400_000,
        '7d': 604_800_000,
        '1mo': 2_592_000_000,
    }[payload.timeframe]
    base_ts = int(now.timestamp() * 1000)
    points = payload.horizon
    p50 = [100.0 + i for i in range(points)]
    p10 = [value * 0.98 for value in p50]
    p90 = [value * 1.02 for value in p50]
    timestamps = [base_ts + step_ms * (i + 1) for i in range(points)]

    return PredictResponse(
        id=f'fcst_{uuid4().hex}',
        symbol=payload.symbol,
        timeframe=payload.timeframe,
        createdAt=now,
        horizon=payload.horizon,
        series=ForecastSeries(p10=p10, p50=p50, p90=p90, t=timestamps),
        model=payload.model or 'baseline-naive',
        modelVersion='v1',
        durationMs=8,
    )
