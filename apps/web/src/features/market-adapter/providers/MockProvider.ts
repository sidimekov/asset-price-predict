// apps/web/src/features/market-adapter/providers/MockProvider.ts
import type { AppDispatch } from '@/shared/store';
import type { ProviderRequestBase } from './types';
import type { CatalogItem } from '@shared/types/market';

type FetchOpts = {
  signal?: AbortSignal;
};

// Deterministic PRNG (seeded) - stable for UX/tests

function hashSeed(input: string): number {
  // simple, fast string hash -> uint32
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
      // приближение - 30 дней, достаточно для моков
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
}

/**
 * MOCK по умолчанию - полностью локальный генератор свечей без сети
 */
export async function fetchMockTimeseries(
  _dispatch: AppDispatch,
  params: ProviderRequestBase,
  _opts: FetchOpts = {},
): Promise<unknown> {
  return generateMockBarsRaw(params);
}

/**
 * (опционально) сетевой мок отдельным режимом
 * если когда-нибудь понадобится
 */
export async function fetchMockTimeseriesViaApi(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
  opts: FetchOpts = {},
): Promise<unknown> {
  const { marketApi } = await import('@/shared/api/marketApi');
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
 * локальный генератор свечей
 * Детерминированный seed = symbol+timeframe+limit
 */
export function generateMockBarsRaw(
  params: ProviderRequestBase,
): [number, number, number, number, number, number][] {
  const { limit, symbol, timeframe } = params;

  const stepMs = timeframeToStepMs(timeframe);
  const seed = hashSeed(`${symbol}:${timeframe}:${limit}`);
  const rnd = mulberry32(seed);

  // текущая точка времени (не Date.now), чтобы не плавали снапшоты
  const baseEpoch = 1700000000000; // ~2023-11-14
  const now = baseEpoch + (seed % (365 * 24 * 60 * 60 * 1000));
  const endTs = Math.floor(now / stepMs) * stepMs;

  const res: [number, number, number, number, number, number][] = [];

  // Базовый уровень зависит от seed, чтобы серии отличались по символам.
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
 * Сырой тип мокового символа (немного отличается от CatalogItem, чтобы была "нормализация").
 */
export type MockSymbolRaw = {
  symbol: string;
  name: string;
  exchange: string;
  class: CatalogItem['assetClass'];
  currency?: string;
};

/**
 * Статический моковый каталог инструментов.
 * Можно потом вынести в отдельный JSON.
 */
const MOCK_SYMBOLS: MockSymbolRaw[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin / Tether',
    exchange: 'BINANCE',
    class: 'crypto',
    currency: 'USDT',
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum / Tether',
    exchange: 'BINANCE',
    class: 'crypto',
    currency: 'USDT',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    class: 'equity',
    currency: 'USD',
  },
  {
    symbol: 'SBER',
    name: 'Sberbank',
    exchange: 'MOEX',
    class: 'equity',
    currency: 'RUB',
  },
];

/**
 * Поиск в моковом каталоге по строке запроса.
 * Никакого HTTP, всё локально.
 */
export async function searchMockSymbols(
  query: string,
): Promise<MockSymbolRaw[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return MOCK_SYMBOLS.filter((item) => {
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.exchange.toLowerCase().includes(q)
    );
  });
}
