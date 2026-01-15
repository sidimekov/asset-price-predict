import type {
  ForecastCreateReq,
  ForecastCreateRes,
} from '@assetpredict/shared';

function isoNow() {
  return new Date().toISOString();
}

export class ForecastController {
  createForecast(req: ForecastCreateReq): ForecastCreateRes {
    // Заглушка - series пустые
    return {
      id: 'mock-forecast-id',
      symbol: req.symbol,
      timeframe: req.timeframe,
      horizon: req.horizon,
      createdAt: isoNow(),
      series: { p10: [], p50: [], p90: [], t: [] },
    };
  }
}
