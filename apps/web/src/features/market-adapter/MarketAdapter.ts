// apps/web/src/features/market-adapter/MarketAdapter.ts
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
import { fetchBinanceTimeseries } from './providers/BinanceProvider';
import {
  fetchMockTimeseries,
  generateMockBarsRaw,
} from './providers/MockProvider';
import { fetchMoexTimeseries } from './providers/MoexProvider';
import type { BinanceKline } from '@/shared/api/marketApi';

// В будущем можно заменить на zod-схемы из @assetpredict/shared,
// но сейчас оставляем простую локальную валидацию
const providerSchema = z.enum(SUPPORTED_PROVIDERS);
const timeframeSchema = z.enum(SUPPORTED_TIMEFRAMES);
const limitSchema = z.number().int().positive().max(2000);

export const marketAdapterRequestSchema = z.object({
  symbol: z.string().min(1),
  provider: providerSchema.optional(),
  timeframe: timeframeSchema.optional(),
  limit: limitSchema.optional(),
});

export type MarketAdapterRequest = z.infer<typeof marketAdapterRequestSchema>;

export type MarketAdapterSource = 'CACHE' | 'NETWORK' | 'LOCAL';

export interface MarketAdapterSuccess {
  bars: Bar[];
  symbol: string;
  provider: MarketDataProvider;
  timeframe: MarketTimeframe;
  source: MarketAdapterSource;
}

export interface MarketAdapterError {
  code:
    | 'INVALID_PARAMS'
    | 'UNSUPPORTED_PROVIDER'
    | 'PROVIDER_ERROR'
    | 'NORMALIZATION_ERROR';
  message: string;
  provider?: MarketDataProvider;
}

function normalizeBinanceKlines(klines: BinanceKline[]): Bar[] {
  try {
    return klines.map((k) => {
      const ts = k[0]; // openTime
      const open = Number(k[1]);
      const high = Number(k[2]);
      const low = Number(k[3]);
      const close = Number(k[4]);
      const volume = Number(k[5]);
      return [ts, open, high, low, close, volume];
    });
  } catch (e) {
    console.error('[MarketAdapter] Failed to normalize Binance klines', e);
    throw new Error('NORMALIZATION_ERROR');
  }
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
  params: { symbol: string; timeframe: MarketTimeframe; limit: number },
): Promise<{ raw: unknown; normalized: Bar[] }> {
  switch (provider) {
    case 'BINANCE': {
      const klines = await fetchBinanceTimeseries(dispatch, params);
      const normalized = normalizeBinanceKlines(klines);
      return { raw: klines, normalized };
    }
    case 'MOCK': {
      const raw = await fetchMockTimeseries(dispatch, params);
      const normalized = normalizeRawBars(raw);
      return { raw, normalized };
    }
    case 'MOEX': {
      const raw = await fetchMoexTimeseries(dispatch, params);
      const normalized = normalizeRawBars(raw);
      return { raw, normalized };
    }
    default:
      throw new Error('UNSUPPORTED_PROVIDER');
  }
}

export async function getMarketTimeseries(
  dispatch: AppDispatch,
  rawRequest: MarketAdapterRequest,
): Promise<MarketAdapterSuccess | MarketAdapterError> {
  const parseResult = marketAdapterRequestSchema.safeParse(rawRequest);
  if (!parseResult.success) {
    console.error('[MarketAdapter] Invalid params', parseResult.error);
    return {
      code: 'INVALID_PARAMS',
      message: 'Invalid market adapter request params',
    };
  }

  const parsed = parseResult.data;
  const provider: MarketDataProvider = parsed.provider ?? DEFAULT_PROVIDER;
  const timeframe: MarketTimeframe =
    (parsed.timeframe as MarketTimeframe) ?? SUPPORTED_TIMEFRAMES[0];
  const limit = parsed.limit ?? DEFAULT_LIMIT;
  const symbol = parsed.symbol;

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return {
      code: 'UNSUPPORTED_PROVIDER',
      message: `Provider ${provider} is not supported`,
      provider,
    };
  }

  const cacheKey = makeTimeseriesCacheKey(provider, symbol, timeframe, limit);
  const cachedBars = clientTimeseriesCache.get(cacheKey);

  if (cachedBars) {
    return {
      bars: cachedBars,
      symbol,
      provider,
      timeframe,
      source: 'CACHE',
    };
  }

  try {
    const { normalized } = await resolveProviderData(dispatch, provider, {
      symbol,
      timeframe,
      limit,
    });

    clientTimeseriesCache.set(cacheKey, normalized);

    return {
      bars: normalized,
      symbol,
      provider,
      timeframe,
      source: 'NETWORK',
    };
  } catch (e: any) {
    if (e?.message === 'NORMALIZATION_ERROR') {
      return {
        code: 'NORMALIZATION_ERROR',
        message: 'Failed to normalize provider data',
        provider,
      };
    }

    if (e?.message === 'UNSUPPORTED_PROVIDER') {
      return {
        code: 'UNSUPPORTED_PROVIDER',
        message: 'Unsupported provider',
        provider,
      };
    }

    console.error('[MarketAdapter] Provider error', e);
    return {
      code: 'PROVIDER_ERROR',
      message: 'Failed to fetch data from provider',
      provider,
    };
  }
}
