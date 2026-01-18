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

import type {
  BinanceKlineRaw,
  MoexCandlesResponse,
} from '@/shared/api/marketApi';
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

export type MarketAdapterProvider = MarketDataProvider | 'MOCK';

export type AdapterCallOpts = {
  signal?: AbortSignal;
};

export interface MarketAdapterSuccess {
  bars: Bar[];
  symbol: string;
  provider: MarketAdapterProvider;
  timeframe: MarketTimeframe;
  source: 'CACHE' | 'NETWORK' | 'LOCAL';
}

export interface MarketAdapterError {
  code: 'INVALID_PARAMS' | 'UNSUPPORTED_PROVIDER' | 'PROVIDER_ERROR';
  message: string;
}

// Нормализация баров
function normalizeBinanceKlines(klines: BinanceKlineRaw[]): Bar[] {
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

function isMoexCandlesResponse(raw: unknown): raw is MoexCandlesResponse {
  if (!raw || typeof raw !== 'object') return false;
  return 'candles' in raw;
}

function normalizeMoexCandlesResponse(raw: MoexCandlesResponse): Bar[] {
  const { columns, data } = raw.candles;
  if (!Array.isArray(columns) || !Array.isArray(data)) return [];

  const idx = (name: string) => columns.indexOf(name);
  const tsIdx = idx('begin') !== -1 ? idx('begin') : idx('end');
  const oIdx = idx('open');
  const hIdx = idx('high');
  const lIdx = idx('low');
  const cIdx = idx('close');
  const vIdx = idx('volume') !== -1 ? idx('volume') : idx('value');

  return data
    .map((row) => {
      const tsRaw = row[tsIdx];
      const ts =
        typeof tsRaw === 'string' ? Date.parse(tsRaw) : Number(tsRaw ?? NaN);
      const o = Number(row[oIdx]);
      const h = Number(row[hIdx]);
      const l = Number(row[lIdx]);
      const c = Number(row[cIdx]);
      const v =
        vIdx === -1 || row[vIdx] == null ? undefined : Number(row[vIdx]);

      return [ts, o, h, l, c, v] as Bar;
    })
    .filter((b) => Number.isFinite(b[0]));
}

function logMoexStats(bars: Bar[]): void {
  if (process.env.NODE_ENV !== 'development' || bars.length === 0) return;
  const avgClose =
    bars.reduce((sum, b) => sum + (Number(b[4]) || 0), 0) / bars.length;
  console.info('[MOEX] candles:', bars.length, 'avgClose:', avgClose);
}

// Приводим timestamp к ms, сортируем и чистим ряд
function normalizeBarsFinal(bars: Bar[]): Bar[] {
  const msBars = bars
    .map((b) => {
      const ts = Number(b[0]);
      const tsMs = ts < 1_000_000_000_000 ? ts * 1000 : ts;
      return [tsMs, b[1], b[2], b[3], b[4], b[5]] as Bar;
    })
    .filter((b) => Number.isFinite(b[0]));

  // Bars должны быть строго возрастающими по времени
  msBars.sort((a, b) => a[0] - b[0]);

  const deduped: Bar[] = [];
  let lastTs = -Infinity;
  for (const b of msBars) {
    if (b[0] <= lastTs) continue;
    deduped.push(b);
    lastTs = b[0];
  }

  return deduped;
}

type ProviderResolveOk = {
  ok: true;
  raw: unknown;
  normalized: Bar[];
  source: MarketAdapterSuccess['source'];
};

type ProviderResolveErr = {
  ok: false;
  error: MarketAdapterError;
};

type ProviderResolveResult = ProviderResolveOk | ProviderResolveErr;

async function resolveProviderData(
  dispatch: AppDispatch,
  provider: MarketAdapterProvider,
  params: ProviderRequestBase,
  opts: AdapterCallOpts = {},
): Promise<ProviderResolveResult> {
  try {
    switch (provider) {
      case 'BINANCE': {
        const klines = await fetchBinanceTimeseries(dispatch, params, opts);
        return {
          ok: true,
          raw: klines,
          normalized: normalizeBarsFinal(normalizeBinanceKlines(klines)),
          source: 'NETWORK',
        };
      }

      case 'MOEX': {
        const moexRaw = await fetchMoexTimeseries(dispatch, params, opts);
        const moexBars = isMoexCandlesResponse(moexRaw)
          ? normalizeMoexCandlesResponse(moexRaw)
          : normalizeRawBars(moexRaw);
        logMoexStats(moexBars);
        return {
          ok: true,
          raw: moexRaw,
          normalized: normalizeBarsFinal(moexBars),
          source: 'NETWORK',
        };
      }

      case 'MOCK': {
        const mockRaw = await fetchMockTimeseries(dispatch, params, opts);
        return {
          ok: true,
          raw: mockRaw,
          normalized: normalizeBarsFinal(normalizeRawBars(mockRaw)),
          source: 'LOCAL',
        };
      }

      case 'CUSTOM': {
        const customRaw = generateMockBarsRaw(params);
        return {
          ok: true,
          raw: customRaw,
          normalized: normalizeBarsFinal(normalizeRawBars(customRaw)),
          source: 'LOCAL',
        };
      }

      default:
        return {
          ok: false,
          error: {
            code: 'UNSUPPORTED_PROVIDER',
            message: `Unsupported provider: ${String(provider)}`,
          },
        };
    }
  } catch (err: any) {
    // Никаких throw наружу
    return {
      ok: false,
      error: {
        code: 'PROVIDER_ERROR',
        message: err?.message || 'Failed to fetch',
      },
    };
  }
}

export async function getMarketTimeseries(
  dispatch: AppDispatch,
  request: MarketAdapterRequest,
  opts: AdapterCallOpts = {},
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

  const resolved = await resolveProviderData(
    dispatch,
    provider as MarketAdapterProvider,
    { symbol, timeframe, limit },
    opts,
  );

  if (!resolved.ok) return resolved.error;

  clientTimeseriesCache.set(cacheKey, resolved.normalized);
  return {
    bars: resolved.normalized,
    symbol,
    provider: provider as MarketAdapterProvider,
    timeframe,
    source: resolved.source,
  };
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
