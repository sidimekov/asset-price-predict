import type { AppDispatch } from '@/shared/store';
import type { ProviderCallOpts, ProviderRequestBase } from './types';
import type { CatalogItem } from '@shared/types/market';

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function timeframeToStepMs(timeframe: string): number {
  switch (timeframe) {
    case '1h':
      return 60 * 60 * 1000;
    case '8h':
      return 8 * 60 * 60 * 1000;
    case '1d':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '1mo':
      return 30 * 24 * 60 * 60 * 1000; // approximation
    default:
      return 60 * 60 * 1000;
  }
}

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
 * Локальный генератор свечей (без сети)
 */
export async function fetchMockTimeseries(
  _dispatch: AppDispatch,
  params: ProviderRequestBase,
  opts: ProviderCallOpts = {},
): Promise<unknown> {
  throwIfAborted(opts.signal);
  return generateMockBarsRaw(params);
}

export function generateMockBarsRaw(
  params: ProviderRequestBase,
): [number, number, number, number, number, number][] {
  const { limit, symbol, timeframe } = params;
  const stepMs = timeframeToStepMs(timeframe);
  const seed = hashSeed(`${symbol}:${timeframe}:${limit}`);
  const rnd = mulberry32(seed);

  const baseEpoch = 1700000000000; // ~2023-11
  const now = baseEpoch + (seed % (365 * 24 * 60 * 60 * 1000));
  const endTs = Math.floor(now / stepMs) * stepMs;

  const res: [number, number, number, number, number, number][] = [];
  let lastClose = 80 + (seed % 120);

  for (let i = limit - 1; i >= 0; i--) {
    const ts = endTs - i * stepMs;
    const open = lastClose;
    const high = open + rnd() * 3;
    const low = open - rnd() * 3;
    const close = low + rnd() * (high - low);
    const volume = 10 + rnd() * 100;

    res.push([ts, open, high, low, close, volume]);
    lastClose = close;
  }

  return res;
}

/**
 * Тип мокового символа для каталога
 */
export type MockSymbolRaw = {
  symbol: string;
  name: string;
  exchange: string;
  assetClass: CatalogItem['assetClass'];
  currency?: string;
};

/**
 * Статический мок-каталог (локальный, без запросов к API)
 */
export const MOCK_SYMBOLS: MockSymbolRaw[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin / Tether',
    exchange: 'BINANCE',
    assetClass: 'crypto',
    currency: 'USDT',
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum / Tether',
    exchange: 'BINANCE',
    assetClass: 'crypto',
    currency: 'USDT',
  },
  {
    symbol: 'SOLUSDT',
    name: 'Solana / Tether',
    exchange: 'BINANCE',
    assetClass: 'crypto',
    currency: 'USDT',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    assetClass: 'equity',
    currency: 'USD',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    exchange: 'NASDAQ',
    assetClass: 'equity',
    currency: 'USD',
  },
  {
    symbol: 'SBER',
    name: 'Sberbank',
    exchange: 'MOEX',
    assetClass: 'equity',
    currency: 'RUB',
  },
  {
    symbol: 'GAZP',
    name: 'Gazprom',
    exchange: 'MOEX',
    assetClass: 'equity',
    currency: 'RUB',
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    exchange: 'MOCKEX',
    assetClass: 'fx',
    currency: 'USD',
  },
];

/**
 * Поиск в локальном мок-каталоге
 */
export async function searchMockSymbols(
  query: string,
  opts: ProviderCallOpts = {},
): Promise<MockSymbolRaw[]> {
  throwIfAborted(opts.signal);

  const q = query.trim().toLowerCase();

  if (!q) {
    return MOCK_SYMBOLS;
  }

  return MOCK_SYMBOLS.filter((item) => {
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.exchange.toLowerCase().includes(q) ||
      (item.assetClass && item.assetClass.toLowerCase().includes(q))
    );
  });
}
