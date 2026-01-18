import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
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

function getErrorMessage(err: any, fallback: string): string {
  const status =
    typeof err?.status === 'number'
      ? err.status
      : typeof err?.originalStatus === 'number'
        ? err.originalStatus
        : undefined;
  const base =
    err?.message ||
    err?.data?.message ||
    err?.data?.error ||
    err?.error ||
    fallback;
  return status ? `${base} (status ${status})` : base;
}

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
      symbol,
      engine: 'stock',
      market: 'shares',
      board: 'TQBR',
      interval: mapTimeframeToMoexInterval(timeframe),
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
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.error('MOEX timeseries fetch failed:', err);
    const message = getErrorMessage(err, 'Request failed');
    throw new Error(`MOEX timeseries fetch failed: ${message}`);
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
    queryResult.unsubscribe();
  }
}

export async function searchMoexSymbols(
  dispatch: AppDispatch,
  query: string,
  opts: ProviderCallOpts = {},
): Promise<unknown> {
  const { signal } = opts;
  throwIfAborted(signal);

  const q = query.trim();

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
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn('MOEX symbols search failed:', err);
    // Возвращаем пустой массив вместо выброса ошибки
    return [];
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
    queryResult.unsubscribe();
  }
}

function mapTimeframeToMoexInterval(
  timeframe: ProviderRequestBase['timeframe'],
): number {
  switch (timeframe) {
    case '1h':
      return 60;
    case '8h':
      return 60;
    case '1d':
      return 24;
    case '7d':
      return 7;
    case '1mo':
      return 31;
    default:
      return 24;
  }
}
