// apps/web/src/features/market-adapter/providers/MoexProvider.ts
import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { Symbol as MarketSymbol, Timeframe } from '@shared/types/market';
import type { ProviderCallOpts, ProviderRequestBase } from './types';

function createAbortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

/**
 * Получение таймсерий с MOEX через RTK Query.
 */
export async function fetchMoexTimeseries(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
  opts: ProviderCallOpts = {},
): Promise<unknown> {
  const { symbol, timeframe, limit } = params;
  const { signal } = opts;

  throwIfAborted(signal);

  const queryResult = dispatch(
    marketApi.endpoints.getMoexTimeseries.initiate({
      symbol: symbol as MarketSymbol,
      timeframe: timeframe as Timeframe,
      limit,
    }),
  );

  const onAbort = () => {
    queryResult.abort();
  };

  if (signal) {
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await queryResult.unwrap();
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
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
  opts: ProviderCallOpts = {},
): Promise<unknown> {
  const { signal } = opts;
  throwIfAborted(signal);

  const q = query.trim();
  if (!q) return [];

  const queryResult = dispatch(
    marketApi.endpoints.searchMoexSymbols.initiate(q),
  );

  const onAbort = () => {
    queryResult.abort();
  };

  if (signal) {
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await queryResult.unwrap();
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
    queryResult.unsubscribe();
  }
}
