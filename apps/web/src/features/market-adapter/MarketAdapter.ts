import { z } from 'zod';
import type { AppDispatch } from '@/shared/store';
import {
  SUPPORTED_PROVIDERS,
  SUPPORTED_TIMEFRAMES,
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
import {
  fetchBinanceTimeseries,
  searchBinanceSymbols,
} from './providers/BinanceProvider';
import {
  fetchMockTimeseries,
  generateMockBarsRaw,
  searchMockSymbols,
  type MockSymbolRaw,
} from './providers/MockProvider';
import {
  fetchMoexTimeseries,
  searchMoexSymbols,
} from './providers/MoexProvider';
import type { BinanceKline } from '@/shared/api/marketApi';
import type { CatalogItem } from '@shared/types/market';
import { zTimeframe, zProvider, zSymbol } from '@shared/schemas/market.schema';
import type { ProviderRequestBase } from './providers/types';

// ---- SCHEMAS for timeseries ----

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
  try {
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
  } catch (e) {
    console.error('[MarketAdapter] Failed to normalize raw bars', e);
    throw new Error('NORMALIZATION_ERROR');
  }
}

async function resolveProviderData(
  dispatch: AppDispatch,
  provider: MarketDataProvider,
  params: ProviderRequestBase,
): Promise<{ raw: unknown; normalized: Bar[] }> {
  switch (provider) {
    case 'BINANCE':
      const klines = await fetchBinanceTimeseries(dispatch, params);
      const normalized = normalizeBinanceKlines(klines);
      return { raw: klines, normalized };
    }

    case 'MOEX': {
      const raw = await fetchMoexTimeseries(dispatch, params);
      const normalized = normalizeRawBars(raw);
      return { raw, normalized };
    }

    case 'CUSTOM': {
      // На будущее: кастомный провайдер можно считать фронтовым mock’ом
      const raw = generateMockBarsRaw(params);
      const normalized = normalizeRawBars(raw);
      return { raw, normalized };
    }

    case 'MOCK': {
      // generateMockBarsRaw можно использовать локально,
      // но для единообразия берём данные через RTK-query и нормализуем
      const raw = await fetchMockTimeseries(dispatch, params);
      const normalized = normalizeRawBars(raw);
      return { raw, normalized };
    }

    default:
      throw new Error('UNSUPPORTED_PROVIDER');
  }
}

// ---- PUBLIC API: TIMESERIES ----

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
    timeframe = '1h' as Timeframe,
    limit = DEFAULT_LIMIT,
  } = result.data;

  const params: ProviderRequestBase = { symbol, timeframe, limit };

  const cacheKey = makeTimeseriesCacheKey(provider, symbol, timeframe, limit);
  const cached = clientTimeseriesCache.get(cacheKey);
  if (cached) {
    return { bars: cached, symbol, provider, timeframe, source: 'CACHE' };
  }

  try {
    const { normalized } = await resolveProviderData(
      dispatch,
      provider,
      params,
    );

    clientTimeseriesCache.set(cacheKey, normalized);
    return { bars: normalized, symbol, provider, timeframe, source: 'NETWORK' };
  } catch (err: any) {
    return {
      code: 'PROVIDER_ERROR',
      message: err.message || 'Failed to fetch',
    };
  }
}

// Моковые данные (реальные эндпоинты подключаются позже)
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
  if (!q) return [];

  if (provider === 'BINANCE') {
    return BINANCE_MOCK.filter(
      (i) =>
        i.symbol.toLowerCase().includes(q) ||
        i.baseAsset.toLowerCase().includes(q),
    );
  }

  if (provider === 'MOEX') {
    return MOEX_MOCK.filter(
      (i) =>
        i.SECID.toLowerCase().includes(q) ||
        (i.SHORTNAME && i.SHORTNAME.toLowerCase().includes(q)),
    );
  }

  return [];
}

function normalizeSearchResult(
  provider: MarketDataProvider,
  raw: unknown,
): CatalogItem[] {
  return normalizeCatalogResponse(raw as any[], provider);
}

export async function searchAssets(
  dispatch: AppDispatch,
  { query, provider }: { query: string; provider: MarketDataProvider },
): Promise<CatalogItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cacheKey = makeSearchCacheKey(provider, q);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SEARCH_TTL_MS) {
    return cached.items;
  }

  const raw = await fetchSearchRaw(dispatch, provider, q);
  const items = normalizeSearchResult(provider, raw);

  searchCache.set(cacheKey, { items, ts: Date.now() });
  return items;
}

// ============================================================================
//                           ASSET CATALOG SEARCH
// ============================================================================

type SearchAssetsRequest = {
  query: string;
  provider: MarketDataProvider;
};

type SearchCacheEntry = {
  items: CatalogItem[];
  expiresAt: number;
};

const searchCache = new Map<string, SearchCacheEntry>();
const SEARCH_TTL_MS = 30_000; // 30 секунд, потом перечитываем

function makeSearchCacheKey(provider: MarketDataProvider, query: string) {
  return `${provider}:${query.trim().toLowerCase()}`;
}

// ---- NORMALIZATION: RAW → CatalogItem[] ----

function normalizeMockSymbols(raw: unknown): CatalogItem[] {
  if (!Array.isArray(raw)) return [];

  return (raw as MockSymbolRaw[])
    .map((item) => {
      if (!item.symbol || !item.name) return null;

      const assetClass = item.class ?? 'other';

      const result: CatalogItem = {
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
        assetClass,
        currency: item.currency,
        provider: 'MOCK',
      };

      return result;
    })
    .filter((x): x is CatalogItem => x !== null);
}

// Заглушки для реальных провайдеров — пока ничего не знаем о формате ответа.
function normalizeBinanceSymbols(_raw: unknown): CatalogItem[] {
  // TODO: как только будет описание ответа, сюда добавим реальную нормализацию
  return [];
}

function normalizeMoexSymbols(_raw: unknown): CatalogItem[] {
  // TODO: как только будет описание ответа, сюда добавим реальную нормализацию
  return [];
}

function normalizeCustomSymbols(_raw: unknown): CatalogItem[] {
  return [];
}

function normalizeSearchResult(
  provider: MarketDataProvider,
  raw: unknown,
): CatalogItem[] {
  switch (provider) {
    case 'MOCK':
      return normalizeMockSymbols(raw);
    case 'BINANCE':
      return normalizeBinanceSymbols(raw);
    case 'MOEX':
      return normalizeMoexSymbols(raw);
    case 'CUSTOM':
      return normalizeCustomSymbols(raw);
    default:
      return [];
  }
}

// ---- RAW FETCH по провайдеру ----

async function fetchSearchRaw(
  dispatch: AppDispatch,
  provider: MarketDataProvider,
  query: string,
): Promise<unknown> {
  switch (provider) {
    case 'MOCK':
      return searchMockSymbols(query);
    case 'BINANCE':
      return searchBinanceSymbols(dispatch, query);
    case 'MOEX':
      return searchMoexSymbols(dispatch, query);
    case 'CUSTOM':
      // пока нет реального кастомного поиска — возвращаем пустой список
      return [];
    default:
      return [];
  }
}

// ---- PUBLIC API: SEARCH ----

export async function searchAssets(
  dispatch: AppDispatch,
  params: SearchAssetsRequest,
): Promise<CatalogItem[]> {
  const query = params.query.trim();
  const provider = params.provider;

  if (!query) {
    return [];
  }

  const cacheKey = makeSearchCacheKey(provider, query);
  const now = Date.now();
  const cached = searchCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.items;
  }

  const raw = await fetchSearchRaw(dispatch, provider, query);
  const normalized = normalizeSearchResult(provider, raw);

  searchCache.set(cacheKey, {
    items: normalized,
    expiresAt: now + SEARCH_TTL_MS,
  });

  return normalized;
}
