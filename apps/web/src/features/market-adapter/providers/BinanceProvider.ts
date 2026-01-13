// apps/web/src/features/market-adapter/providers/BinanceProvider.ts
import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { BinanceKline } from '@/shared/api/marketApi';
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

function mapTimeframeToBinanceInterval(
  timeframe: ProviderRequestBase['timeframe'],
): string {
  switch (timeframe) {
    case '1h':
      return '1h';
    case '8h':
      return '8h';
    case '1d':
      return '1d';
    case '7d':
      return '1w';
    case '1mo':
      return '1M';
    default:
      return timeframe;
  }
}

export async function fetchBinanceTimeseries(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
  opts: ProviderCallOpts = {},
): Promise<BinanceKline[]> {
  const { symbol, timeframe, limit } = params;
  const { signal } = opts;

  throwIfAborted(signal);

  const interval = mapTimeframeToBinanceInterval(timeframe);

  const queryResult = dispatch(
    marketApi.endpoints.getBinanceTimeseries.initiate({
      symbol,
      interval,
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
    const data = await queryResult.unwrap();
    return data;
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
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
  opts: ProviderCallOpts = {},
): Promise<unknown> {
  const { signal } = opts;
  throwIfAborted(signal);

  const q = query.trim();
  if (!q) return [];

  const queryResult = dispatch(
    marketApi.endpoints.searchBinanceSymbols.initiate(q),
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
