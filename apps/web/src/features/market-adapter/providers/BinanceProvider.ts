import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { BinanceKlineRaw } from '@/shared/api/marketApi';
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
): Promise<BinanceKlineRaw[]> {
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
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.error('Binance timeseries fetch failed:', err);
    throw new Error(`Binance timeseries fetch failed: ${err.message}`);
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
    queryResult.unsubscribe();
  }
}

export async function fetchBinanceExchangeInfo(
  dispatch: AppDispatch,
  opts: ProviderCallOpts = {},
): Promise<{ symbols: any[] } | undefined> {
  const { signal } = opts;
  throwIfAborted(signal);

  const queryResult = dispatch(
    marketApi.endpoints.getBinanceExchangeInfo.initiate(),
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
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn('Failed to fetch Binance exchange info:', err);
    return { symbols: [] };
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
    queryResult.unsubscribe();
  }
}

export async function searchBinanceSymbols(
  dispatch: AppDispatch,
  query: string,
  opts: ProviderCallOpts = {},
): Promise<unknown> {
  const { signal } = opts;
  throwIfAborted(signal);

  const q = query.trim();

  if (!q) {
    return [];
  }

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
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn('Binance symbols search failed:', err);
    return [];
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
    queryResult.unsubscribe();
  }
}
