// apps/web/src/features/market-adapter/MarketAdapter.ts

import { z } from 'zod';
import type { AppDispatch } from '@/shared/store';
import {
  DEFAULT_PROVIDER,
  DEFAULT_LIMIT,
  type MarketDataProvider,
  type MarketTimeframe,
} from '@/config/market';
import {
  clientTimeseriesCache,
  makeTimeseriesCacheKey,
  type Bar,
} from './cache/ClientTimeseriesCache';

import { fetchBinanceTimeseries } from './providers/BinanceProvider';
import {
  fetchMockTimeseries,
  generateMockBarsRaw,
} from './providers/MockProvider';
import { fetchMoexTimeseries } from './providers/MoexProvider';

import type { BinanceKline } from '@/shared/api/marketApi';
import type { CatalogItem } from '@shared/types/market';
import { normalizeCatalogResponse } from '@/features/asset-catalog/lib/normalizeCatalogItem';
import { zTimeframe, zProvider, zSymbol } from '@shared/schemas/market.schema';
import type { ProviderRequestBase } from './providers/types';

// ============================================================================
// TIMESERIES
// ============================================================================

const providerSchema = zProvider.or(z.literal('MOCK'));
const timeframeSchema = zTimeframe;
const limitSchema = z.number().int().positive().max(2000);

export const marketAdapterRequestSchema = z.object({
  symbol: zSymbol,
  provider: providerSchema.optional(),
  timeframe: timeframeSchema.optional(),
  limit: limitSchema.optional(),
});

export type MarketAdapterRequest = z.infer<typeof marketAdapterRequestSchema>;

export interface MarketAdapterSuccess {
  bars: Bar[];
  symbol: string;
  provider: MarketDataProvider;
  timeframe: MarketTimeframe;
  source: 'CACHE' | 'NETWORK' | 'LOCAL';
}

export interface MarketAdapterError {
  code: 'INVALID_PARAMS' | 'UNSUPPORTED_PROVIDER' | 'PROVIDER_ERROR';
  message: string;
}

// Нормализация баров
function normalizeBinanceKlines(klines: BinanceKline[]): Bar[] {
  return klines.map((k) => [
    k[0],
    Number(k[1]),
    Number(k[2]),
    Number(k[3]),
    Number(k[4]),
    Number(k[5]),
  ]);
}

function normalizeRawBars(raw: unknown): Bar[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b: any) => {
    const [ts, o, h, l, c, v] = b;
    return [
      Number(ts),
      Number(o),
      Number(h),
      Number(l),
      Number(c),
      v != null ? Number(v) : undefined,
    ];
  });
}

async function resolveProviderData(
  dispatch: AppDispatch,
  provider: MarketDataProvider,
  params: ProviderRequestBase,
): Promise<{ raw: unknown; normalized: Bar[] }> {
  switch (provider) {
    case 'BINANCE':
      const klines = await fetchBinanceTimeseries(dispatch, params);
      return { raw: klines, normalized: normalizeBinanceKlines(klines) };

    case 'MOEX':
      const moexRaw = await fetchMoexTimeseries(dispatch, params);
      return { raw: moexRaw, normalized: normalizeRawBars(moexRaw) };

    case 'MOCK':
      const mockRaw = await fetchMockTimeseries(dispatch, params);
      return { raw: mockRaw, normalized: normalizeRawBars(mockRaw) };

    case 'CUSTOM':
      const customRaw = generateMockBarsRaw(params);
      return { raw: customRaw, normalized: normalizeRawBars(customRaw) };

    default:
      throw new Error('Unsupported provider');
  }
}

export async function getMarketTimeseries(
  dispatch: AppDispatch,
  request: MarketAdapterRequest,
): Promise<MarketAdapterSuccess | MarketAdapterError> {
  const result = marketAdapterRequestSchema.safeParse(request);
  if (!result.success) {
    return { code: 'INVALID_PARAMS', message: 'Invalid request' };
  }

  const {
    symbol,
    provider = DEFAULT_PROVIDER,
    timeframe = '1h' as MarketTimeframe,
    limit = DEFAULT_LIMIT,
  } = result.data;

  const cacheKey = makeTimeseriesCacheKey(provider, symbol, timeframe, limit);
  const cached = clientTimeseriesCache.get(cacheKey);
  if (cached) {
    return { bars: cached, symbol, provider, timeframe, source: 'CACHE' };
  }

  try {
    const { normalized } = await resolveProviderData(dispatch, provider, {
      symbol,
      timeframe,
      limit,
    });

    clientTimeseriesCache.set(cacheKey, normalized);
    return { bars: normalized, symbol, provider, timeframe, source: 'NETWORK' };
  } catch (err: any) {
    return {
      code: 'PROVIDER_ERROR',
      message: err.message || 'Failed to fetch',
    };
  }
}

// ============================================================================
// ASSET CATALOG SEARCH — РАБОЧАЯ ВЕРСИЯ
// ============================================================================

// Моковые данные
const BINANCE_MOCK = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT' },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT' },
];

const MOEX_MOCK = [
  { SECID: 'SBER', SHORTNAME: 'Сбербанк', CURRENCYID: 'RUB', TYPE: 'stock' },
  { SECID: 'GAZP', SHORTNAME: 'Газпром', CURRENCYID: 'RUB', TYPE: 'stock' },
  { SECID: 'YNDX', SHORTNAME: 'Яндекс', CURRENCYID: 'RUB', TYPE: 'stock' },
  { SECID: 'LKOH', SHORTNAME: 'Лукойл', CURRENCYID: 'RUB', TYPE: 'stock' },
  { SECID: 'ROSN', SHORTNAME: 'Роснефть', CURRENCYID: 'RUB', TYPE: 'stock' },
  { SECID: 'VTBR', SHORTNAME: 'ВТБ', CURRENCYID: 'RUB', TYPE: 'stock' },
];

const searchCache = new Map<string, { items: CatalogItem[]; ts: number }>();
const SEARCH_TTL_MS = 30_000;

function makeSearchCacheKey(
  provider: MarketDataProvider,
  query: string,
): string {
  return `${provider}:${query.trim().toLowerCase()}`;
}

async function fetchSearchRaw(
  _dispatch: AppDispatch,
  provider: MarketDataProvider,
  query: string,
): Promise<unknown[]> {
  const q = query.trim().toLowerCase();

  if (provider === 'BINANCE') {
    const filtered = BINANCE_MOCK.filter(
      (i) =>
        i.symbol.toLowerCase().includes(q) ||
        i.baseAsset.toLowerCase().includes(q),
    );
    return !q ? BINANCE_MOCK : filtered;
  }

  if (provider === 'MOEX') {
    const filtered = MOEX_MOCK.filter(
      (i) =>
        i.SECID.toLowerCase().includes(q) ||
        (i.SHORTNAME && i.SHORTNAME.toLowerCase().includes(q)),
    );
    return !q ? MOEX_MOCK : filtered;
  }

  return [];
}

export async function searchAssets(
  dispatch: AppDispatch,
  { query, provider }: { query: string; provider: MarketDataProvider },
): Promise<CatalogItem[]> {
  const q = query.trim();

  const cacheKey = makeSearchCacheKey(provider, q);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SEARCH_TTL_MS) {
    return cached.items;
  }

  const raw = await fetchSearchRaw(dispatch, provider, q);
  const items = normalizeCatalogResponse(raw as any[], provider);

  searchCache.set(cacheKey, { items, ts: Date.now() });
  return items;
}
