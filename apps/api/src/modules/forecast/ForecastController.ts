import type {
  ForecastCreateReq,
  ForecastCreateRes,
  ForecastId,
} from '@assetpredict/shared';

import { insertForecast } from '../../repositories/forecast.repo.js';

export class ForecastController {
  async createForecast(
    req: ForecastCreateReq,
    userId: string,
  ): Promise<ForecastCreateRes> {
    const series = { p10: [], p50: [], p90: [], t: [] };
    const inserted = await insertForecast({
      userId,
      symbol: req.symbol,
      timeframe: req.timeframe,
      horizon: req.horizon,
      series,
      model: req.model,
      params: req.inputUntil ? { inputUntil: req.inputUntil } : undefined,
    });

    if (!inserted) {
      throw new Error('Failed to persist forecast');
    }

    return {
      id: inserted.id as ForecastId,
      symbol: inserted.symbol,
      timeframe: inserted.timeframe as ForecastCreateRes['timeframe'],
      horizon: Number(inserted.horizon),
      createdAt: inserted.created_at.toISOString(),
      series: inserted.series as ForecastCreateRes['series'],
    };
  }
}
