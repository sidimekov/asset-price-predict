import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { BinanceKline } from '@/shared/api/marketApi';
import type { Symbol as MarketSymbol, Timeframe } from '@assetpredict/shared';

/**
 * Базовый контракт для запросов к любому маркет-провайдеру.
 * Типы symbol/timeframe берём из @assetpredict/shared.
 */
export interface ProviderRequestBase {
  symbol: MarketSymbol;
  timeframe: Timeframe;
  limit: number;
}

/**
 * Получение таймсерий с Binance через RTK Query.
 */
export async function fetchBinanceTimeseries(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
): Promise<BinanceKline[]> {
  const { symbol, timeframe, limit } = params;

  // при необходимости тут можно сделать маппинг timeframe → interval
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
