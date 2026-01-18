import type {
  ForecastCreateRes,
  ForecastDetailRes,
  ForecastId,
  ForecastListRes,
} from '@assetpredict/shared';

import {
  countForecasts,
  getForecastById,
  listForecasts,
} from '../../repositories/forecast.repo.js';

export class HistoryController {
  async listForecasts(
    opts: { page: number; limit: number },
    userId: string,
  ): Promise<ForecastListRes> {
    const [rows, total] = await Promise.all([
      listForecasts(userId, opts),
      countForecasts(userId),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id as ForecastId,
        symbol: row.symbol,
        timeframe: row.timeframe as ForecastCreateRes['timeframe'],
        horizon: Number(row.horizon),
        createdAt: row.created_at.toISOString(),
      })),
      total,
      page: opts.page,
      limit: opts.limit,
    };
  }

  async getForecastDetail(
    id: string,
    userId: string,
  ): Promise<ForecastDetailRes | null> {
    const row = await getForecastById(id, userId);
    if (!row) return null;

    return {
      id: row.id as ForecastId,
      symbol: row.symbol,
      timeframe: row.timeframe as ForecastCreateRes['timeframe'],
      horizon: Number(row.horizon),
      createdAt: row.created_at.toISOString(),
      series: row.series as ForecastDetailRes['series'],
      factors: (row.factors as ForecastDetailRes['factors']) ?? undefined,
      metrics: (row.metrics as ForecastDetailRes['metrics']) ?? undefined,
    };
  }
}
