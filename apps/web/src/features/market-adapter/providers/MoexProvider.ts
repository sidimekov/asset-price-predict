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
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.error('MOEX timeseries fetch failed:', err);
    throw new Error(`MOEX timeseries fetch failed: ${err.message}`);
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
