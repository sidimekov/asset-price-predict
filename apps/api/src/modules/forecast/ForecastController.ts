import type { ForecastCreateReq } from '@assetpredict/shared';

function isoNow() {
  return new Date().toISOString();
}

export class ForecastController {
  createForecast(req: Partial<ForecastCreateReq>) {
    return {
      id: 'mock-forecast-id',
      symbol: req.symbol ?? 'BTCUSDT',
      timeframe: req.timeframe ?? '1d',
      horizon: req.horizon ?? 12,
      createdAt: isoNow(),
      series: { p10: [], p50: [], p90: [], t: [] },
    };
  }
}
