from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from .domain import ForecastSeries, PredictInput, PredictOutput, Timeframe


class ForecastCreateRequest(PredictInput):
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

    input_until: datetime | None = Field(default=None, alias='inputUntil', examples=['2025-01-31T12:00:00Z'])


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

    output = PredictOutput(
        series=ForecastSeries(p10=p10, p50=p50, p90=p90, t=timestamps),
        model_id=payload.model,
        model_version='v1',
        duration_ms=8,
    )

    return PredictResponse(
        id=f'fcst_{uuid4().hex}',
        symbol=payload.symbol,
        timeframe=payload.timeframe,
        createdAt=now,
        horizon=payload.horizon,
        series=output.series,
        model=output.model_id,
        modelVersion=output.model_version,
        durationMs=output.duration_ms,
    )
