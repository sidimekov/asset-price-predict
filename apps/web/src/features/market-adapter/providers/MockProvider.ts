// apps/web/src/features/market-adapter/providers/MockProvider.ts
import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { ProviderRequestBase } from './types';

/**
 * Вариант 1 – берём моковые данные с API через RTK Query.
 */
export async function fetchMockTimeseries(
    dispatch: AppDispatch,
    params: ProviderRequestBase,
): Promise<unknown> {
  const { symbol, timeframe, limit } = params;

  const queryResult = dispatch(
      marketApi.endpoints.getMockTimeseries.initiate({
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

/**
 * Вариант 2 – полностью локальный генератор свечей без сети.
 */
export function generateMockBarsRaw(
    params: ProviderRequestBase,
): [number, number, number, number, number, number][] {
  const { limit } = params;
  const now = Date.now();
  const res: [number, number, number, number, number, number][] = [];

  let lastClose = 100;

  for (let i = limit - 1; i >= 0; i--) {
    const ts = now - i * 60 * 60 * 1000; // шаг 1h
    const open = lastClose;
    const high = open + Math.random() * 3;
    const low = open - Math.random() * 3;
    const close = low + Math.random() * (high - low);
    const volume = 10 + Math.random() * 100;

    res.push([ts, open, high, low, close, volume]);
    lastClose = close;
  }

  return res;
}