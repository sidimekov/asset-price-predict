// apps/web/src/features/market-adapter/providers/BinanceProvider.ts
import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { BinanceKline } from '@/shared/api/marketApi';
import type { ProviderRequestBase } from './types';

export async function fetchBinanceTimeseries(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
): Promise<BinanceKline[]> {
  const { symbol, timeframe, limit } = params;

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

/**
 * Поиск символов на Binance по строке запроса.
 * Возвращает сырой ответ провайдера (без нормализации).
 */
export async function searchBinanceSymbols(
  dispatch: AppDispatch,
  query: string,
): Promise<unknown> {
  const q = query.trim();
  if (!q) return [];

  const queryResult = dispatch(
    marketApi.endpoints.searchBinanceSymbols.initiate(q),
  );

  try {
    return await queryResult.unwrap();
  } finally {
    queryResult.unsubscribe();
  }
}
