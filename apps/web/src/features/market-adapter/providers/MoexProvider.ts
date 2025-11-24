// apps/web/src/features/market-adapter/providers/MoexProvider.ts
import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { Symbol as MarketSymbol, Timeframe } from '@shared/types/market';
import type { ProviderRequestBase } from './BinanceProvider';

/**
 * Получение таймсерий с MOEX через RTK Query.
 */
export async function fetchMoexTimeseries(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
): Promise<unknown> {
  const { symbol, timeframe, limit } = params;

  const queryResult = dispatch(
    marketApi.endpoints.getMoexTimeseries.initiate({
      symbol: symbol as MarketSymbol,
      timeframe: timeframe as Timeframe,
      limit,
    }),
  );

  try {
    return await queryResult.unwrap();
  } finally {
    queryResult.unsubscribe();
  }
}

/**
 * Поиск символов на MOEX по строке запроса.
 * Возвращает сырой ответ провайдера (без нормализации).
 */
export async function searchMoexSymbols(
  dispatch: AppDispatch,
  query: string,
): Promise<unknown> {
  const q = query.trim();
  if (!q) return [];

  const queryResult = dispatch(
    marketApi.endpoints.searchMoexSymbols.initiate(q),
  );

  try {
    return await queryResult.unwrap();
  } finally {
    queryResult.unsubscribe();
  }
}
