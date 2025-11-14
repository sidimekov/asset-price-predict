// apps/web/src/features/market-adapter/providers/BinanceProvider.ts
import type { AppDispatch } from '@/shared/store'; //
import { marketApi, BinanceKline } from '@/shared/api/marketApi';

export interface ProviderRequestBase {
  symbol: string;
  timeframe: string;
  limit: number;
}

export async function fetchBinanceTimeseries(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
): Promise<BinanceKline[]> {
  const { symbol, timeframe, limit } = params;

  // бинансовский interval может совпадать с timeframe, при необходимости сделай маппинг
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
    // Отписка от запроса RTK Query
    queryResult.unsubscribe();
  }
}
