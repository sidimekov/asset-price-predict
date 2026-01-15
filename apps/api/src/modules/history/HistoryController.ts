import type {
  ForecastDetailRes,
  ForecastId,
  ForecastListRes,
} from '@assetpredict/shared';

function isoNow() {
  return new Date().toISOString();
}

export class HistoryController {
  listForecasts(_opts: { page: number; limit: number }): ForecastListRes {
    return { items: [], total: 0, page: 1, limit: 20 };
  }

  getForecastDetail(id: string): ForecastDetailRes {
    // /forecasts/invalid -> возврат невалидных series (разные длины) и должно быть 500
    if (id === 'invalid') {
      return {
        id: id as ForecastId,
        symbol: 'BTCUSDT',
        timeframe: '1d',
        horizon: 12,
        createdAt: isoNow(),
        series: { p10: [1], p50: [], p90: [], t: [] }, // невалидно по zForecastSeries
        factors: [],
        metrics: {},
      };
    }

    return {
      id: id as ForecastId,
      symbol: 'BTCUSDT',
      timeframe: '1d',
      horizon: 12,
      createdAt: isoNow(),
      series: { p10: [], p50: [], p90: [], t: [] },
      factors: [],
      metrics: {},
    };
  }
}
