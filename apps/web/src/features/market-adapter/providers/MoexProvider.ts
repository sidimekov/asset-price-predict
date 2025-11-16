import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { ProviderRequestBase } from './BinanceProvider';

/**
 * Провайдер MOEX. Пока реализация через RTK Query-эндпоинт.
 * Контракт запроса переиспользует общий ProviderRequestBase.
 */
export async function fetchMoexTimeseries(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
): Promise<unknown> {
  const { symbol, timeframe, limit } = params;

  const queryResult = dispatch(
    marketApi.endpoints.getMoexTimeseries.initiate({
      symbol,
      timeframe,
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
