// apps/web/src/__tests__/features/market-adapter/MarketAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppDispatch } from '@/shared/store';

// 1. Мокаем конфиг маркет-провайдеров
vi.mock('@/config/market', () => {
  const SUPPORTED_PROVIDERS = ['BINANCE', 'MOCK', 'MOEX'] as const;
  const SUPPORTED_TIMEFRAMES = ['1h', '4h'] as const;
  const DEFAULT_PROVIDER = 'BINANCE' as const;
  const DEFAULT_LIMIT = 100;

  return {
    SUPPORTED_PROVIDERS,
    SUPPORTED_TIMEFRAMES,
    DEFAULT_PROVIDER,
    DEFAULT_LIMIT,
    // типы импортируются только как type, поэтому здесь не нужны
  };
});

// 2. Мокаем кэш
vi.mock('@/features/market-adapter/cache/ClientTimeseriesCache', () => {
  const cache = new Map<string, any>();

  return {
    clientTimeseriesCache: {
      get: vi.fn((key: string) => cache.get(key)),
      set: vi.fn((key: string, value: any) => {
        cache.set(key, value);
      }),
    },
    makeTimeseriesCacheKey: vi.fn(
      (provider: string, symbol: string, timeframe: string, limit: number) =>
        `${provider}:${symbol}:${timeframe}:${limit}`,
    ),
  };
});

// 3. Мокаем провайдеры
vi.mock('@/features/market-adapter/providers/BinanceProvider', () => ({
  fetchBinanceTimeseries: vi.fn(),
}));

vi.mock('@/features/market-adapter/providers/MockProvider', () => ({
  fetchMockTimeseries: vi.fn(),
  generateMockBarsRaw: vi.fn(),
}));

vi.mock('@/features/market-adapter/providers/MoexProvider', () => ({
  fetchMoexTimeseries: vi.fn(),
}));

// 4. Импорты уже после vi.mock
import { getMarketTimeseries } from '@/features/market-adapter/MarketAdapter';
import { clientTimeseriesCache } from '@/features/market-adapter/cache/ClientTimeseriesCache';
import { fetchBinanceTimeseries } from '@/features/market-adapter/providers/BinanceProvider';
import { fetchMockTimeseries } from '@/features/market-adapter/providers/MockProvider';
import { fetchMoexTimeseries } from '@/features/market-adapter/providers/MoexProvider';

const dispatch = vi.fn() as unknown as AppDispatch;

describe('getMarketTimeseries (MarketAdapter)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает INVALID_PARAMS при невалидном запросе (пустой symbol)', async () => {
    const result = await getMarketTimeseries(dispatch, { symbol: '' } as any);

    expect('code' in result).toBe(true);
    if ('code' in result) {
      expect(result.code).toBe('INVALID_PARAMS');
    }
  });

  it('использует кэш и не зовёт провайдер, если данные уже есть', async () => {
    const cachedBars = [[1, 1, 2, 0.5, 1.5, 100]] as any;

    (clientTimeseriesCache.get as any).mockReturnValueOnce(cachedBars);

    const result = await getMarketTimeseries(dispatch, {
      symbol: 'BTCUSDT',
      provider: 'BINANCE',
      timeframe: '1h',
      limit: 1,
    });

    expect(clientTimeseriesCache.get).toHaveBeenCalledTimes(1);
    expect(fetchBinanceTimeseries).not.toHaveBeenCalled();

    expect(result).toEqual({
      bars: cachedBars,
      symbol: 'BTCUSDT',
      provider: 'BINANCE',
      timeframe: '1h',
      source: 'CACHE',
    });
  });

  it('делает запрос к BINANCE, нормализует klines и возвращает source=NETWORK', async () => {
    (clientTimeseriesCache.get as any).mockReturnValueOnce(undefined);

    const rawKlines = [[1000, '1', '2', '0.5', '1.5', '10']] as any;
    (fetchBinanceTimeseries as any).mockResolvedValueOnce(rawKlines);

    const result = await getMarketTimeseries(dispatch, {
      symbol: 'BTCUSDT',
      provider: 'BINANCE',
      timeframe: '1h',
      limit: 1,
    });

    expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
      symbol: 'BTCUSDT',
      timeframe: '1h',
      limit: 1,
    });

    expect(clientTimeseriesCache.set).toHaveBeenCalledTimes(1);

    expect('bars' in result).toBe(true);
    if ('bars' in result) {
      expect(result.source).toBe('NETWORK');
      expect(result.bars).toEqual([[1000, 1, 2, 0.5, 1.5, 10]]);
    }
  });

  it('делает запрос к MOCK и нормализует raw бары через normalizeRawBars', async () => {
    (clientTimeseriesCache.get as any).mockReturnValueOnce(undefined);

    const rawBars = [[1000, 1, 2, 0.5, 1.5, 10]] as any;
    (fetchMockTimeseries as any).mockResolvedValueOnce(rawBars);

    const result = await getMarketTimeseries(dispatch, {
      symbol: 'TEST',
      provider: 'MOCK',
      timeframe: '1h',
      limit: 2,
    });

    expect(fetchMockTimeseries).toHaveBeenCalledWith(dispatch, {
      symbol: 'TEST',
      timeframe: '1h',
      limit: 2,
    });

    expect('bars' in result).toBe(true);
    if ('bars' in result) {
      expect(result.source).toBe('NETWORK');
      expect(result.bars).toEqual([[1000, 1, 2, 0.5, 1.5, 10]]);
    }
  });

  it('возвращает NORMALIZATION_ERROR, если нормализация Binance klines падает', async () => {
    (clientTimeseriesCache.get as any).mockReturnValueOnce(undefined);

    // передаём null вместо массива — normalizeBinanceKlines кинет и завернётся в NORMALIZATION_ERROR
    (fetchBinanceTimeseries as any).mockResolvedValueOnce(null);

    const result = await getMarketTimeseries(dispatch, {
      symbol: 'BTCUSDT',
      provider: 'BINANCE',
      timeframe: '1h',
      limit: 1,
    });

    expect('code' in result).toBe(true);
    if ('code' in result) {
      expect(result.code).toBe('NORMALIZATION_ERROR');
      expect(result.provider).toBe('BINANCE');
    }
  });

  it('возвращает PROVIDER_ERROR, если провайдер кидает произвольную ошибку', async () => {
    (clientTimeseriesCache.get as any).mockReturnValueOnce(undefined);

    (fetchMoexTimeseries as any).mockRejectedValueOnce(
      new Error('SOME_PROVIDER_ERROR'),
    );

    const result = await getMarketTimeseries(dispatch, {
      symbol: 'SBER',
      provider: 'MOEX',
      timeframe: '1h',
      limit: 10,
    });

    expect(fetchMoexTimeseries).toHaveBeenCalledTimes(1);

    expect('code' in result).toBe(true);
    if ('code' in result) {
      expect(result.code).toBe('PROVIDER_ERROR');
      expect(result.provider).toBe('MOEX');
    }
  });
});
