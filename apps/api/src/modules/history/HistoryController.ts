function isoNow() {
  return new Date().toISOString();
}

export class HistoryController {
  listForecasts(_opts: { page: number; limit: number }) {
    // заглушка пагинации
    return { items: [], total: 0, page: 1, limit: 20 };
  }

  getForecastDetail(id: string) {
    // пустая деталь как POST /forecast + factors:[], metrics:{}
    return {
      id,
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
