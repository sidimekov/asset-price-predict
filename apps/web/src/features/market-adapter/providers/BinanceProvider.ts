// apps/web/src/features/market-adapter/providers/BinanceProvider.ts
import type { AppDispatch } from '@/shared/store';
import { marketApi, type BinanceKline } from '@/shared/api/marketApi';
import type { ProviderRequestBase } from './types';

/**
 * Получение таймсерий с Binance через RTK Query.
 */
export async function fetchBinanceTimeseries(
    dispatch: AppDispatch,
    params: ProviderRequestBase,
): Promise<BinanceKline[]> {
  const { symbol, timeframe, limit } = params;

  // при необходимости можно сделать маппинг timeframe → interval
  const queryResult = dispatch(
      marketApi.endpoints.getBinanceTimeseries.initiate({
        symbol,
        interval: timeframe,
        limit,
      }),
  );

  try {
    const data = await queryResult.unwrap();
    return data;
  } finally {
    queryResult.unsubscribe();
  }
}