// apps/web/src/__tests__/features/market-adapter/MarketAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppDispatch } from '@/shared/store';
import type { Provider, Timeframe } from '@shared/types/market';
import type { CatalogItem } from '@shared/types/market';
import type { BinanceKline } from '@/shared/api/marketApi';

// Мокаем конфиг маркет-провайдеров
vi.mock('@/config/market', () => ({
  SUPPORTED_PROVIDERS: ['BINANCE', 'MOCK', 'MOEX', 'CUSTOM'],
  SUPPORTED_TIMEFRAMES: ['1h', '4h'],
  DEFAULT_PROVIDER: 'BINANCE',
  DEFAULT_LIMIT: 100,
}));

// Мокаем кэш
vi.mock('@/features/market-adapter/cache/ClientTimeseriesCache', () => ({
  clientTimeseriesCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
  makeTimeseriesCacheKey: vi.fn(
    (provider: string, symbol: string, timeframe: string, limit: number) =>
      `${provider}:${symbol}:${timeframe}:${limit}`,
  ),
}));

// Мокаем провайдеры
vi.mock('@/features/market-adapter/providers/BinanceProvider', () => ({
  fetchBinanceTimeseries: vi.fn(),
  searchBinanceSymbols: vi.fn(),
}));

vi.mock('@/features/market-adapter/providers/MockProvider', () => ({
  fetchMockTimeseries: vi.fn(),
  generateMockBarsRaw: vi.fn(),
  searchMockSymbols: vi.fn(),
}));

vi.mock('@/features/market-adapter/providers/MoexProvider', () => ({
  fetchMoexTimeseries: vi.fn(),
  searchMoexSymbols: vi.fn(),
}));

// Мокаем функции нормализации
vi.mock('@/features/asset-catalog/lib/normalizeCatalogItem', () => ({
  normalizeCatalogResponse: vi.fn(),
}));

// Импорты после моков
import {
  getMarketTimeseries,
  searchAssets,
} from '@/features/market-adapter/MarketAdapter';
import { clientTimeseriesCache } from '@/features/market-adapter/cache/ClientTimeseriesCache';
import { fetchBinanceTimeseries } from '@/features/market-adapter/providers/BinanceProvider';
import {
  fetchMockTimeseries,
  generateMockBarsRaw,
} from '@/features/market-adapter/providers/MockProvider';
import { fetchMoexTimeseries } from '@/features/market-adapter/providers/MoexProvider';
import { normalizeCatalogResponse } from '@/features/asset-catalog/lib/normalizeCatalogItem';

// Используем реальные типы из приложения
type Bar = [number, number, number, number, number, number];

// Создаем правильные моковые данные на основе реального типа BinanceKline
const createMockBinanceKline = (
  time: number,
  open: string,
  high: string,
  low: string,
  close: string,
  volume: string,
): BinanceKline => [
  time, // 0: Open time
  open, // 1: Open
  high, // 2: High
  low, // 3: Low
  close, // 4: Close
  volume, // 5: Volume
  time + 1000, // 6: Close time
  '1.0', // 7: Quote asset volume
  10, // 8: Number of trades
  '1.0', // 9: Taker buy base asset volume
  '1.0', // 10: Taker buy quote asset volume
  '0', // 11: Ignore
];

const dispatch = vi.fn() as unknown as AppDispatch;

describe('getMarketTimeseries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('returns INVALID_PARAMS for empty symbol', async () => {
      const result = await getMarketTimeseries(dispatch, { symbol: '' });

      expect(result).toEqual({
        code: 'INVALID_PARAMS',
        message: 'Invalid request',
      });
    });

    it('returns INVALID_PARAMS for invalid provider', async () => {
      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        // @ts-expect-error - testing invalid provider
        provider: 'INVALID',
      });

      expect(result).toEqual({
        code: 'INVALID_PARAMS',
        message: 'Invalid request',
      });
    });

    it('returns INVALID_PARAMS for invalid timeframe', async () => {
      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        // @ts-expect-error - testing invalid timeframe
        timeframe: 'INVALID',
      });

      expect(result).toEqual({
        code: 'INVALID_PARAMS',
        message: 'Invalid request',
      });
    });

    it('returns INVALID_PARAMS for invalid limit', async () => {
      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        limit: -1,
      });

      expect(result).toEqual({
        code: 'INVALID_PARAMS',
        message: 'Invalid request',
      });
    });
  });

  describe('cache behavior', () => {
    it('returns cached data when available', async () => {
      const cachedBars: Bar[] = [[1000, 1, 2, 0.5, 1.5, 10]];
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(cachedBars);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 100,
      });

      expect(clientTimeseriesCache.get).toHaveBeenCalledWith(
        'BINANCE:BTCUSDT:1h:100',
      );
      expect(fetchBinanceTimeseries).not.toHaveBeenCalled();

      expect(result).toEqual({
        bars: cachedBars,
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        source: 'CACHE',
      });
    });

    it('fetches from network when cache is empty', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      const klines: BinanceKline[] = [
        createMockBinanceKline(1000, '1', '2', '0.5', '1.5', '10'),
      ];
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue(klines);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 100,
      });

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
      expect(clientTimeseriesCache.set).toHaveBeenCalledWith(
        'BINANCE:BTCUSDT:1h:100',
        [[1000, 1, 2, 0.5, 1.5, 10]],
      );

      expect(result).toEqual({
        bars: [[1000, 1, 2, 0.5, 1.5, 10]],
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        source: 'NETWORK',
      });
    });
  });

  describe('provider integration', () => {
    it('handles BINANCE provider with kline normalization', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      const klines: BinanceKline[] = [
        createMockBinanceKline(1000, '1.0', '2.0', '0.5', '1.5', '100.0'),
        createMockBinanceKline(2000, '1.5', '2.5', '1.0', '2.0', '150.0'),
      ];
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue(klines);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'ETHUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 2,
      });

      expect(result).toEqual({
        bars: [
          [1000, 1, 2, 0.5, 1.5, 100],
          [2000, 1.5, 2.5, 1, 2, 150],
        ],
        symbol: 'ETHUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        source: 'NETWORK',
      });
    });

    it('handles MOCK provider with raw bars normalization', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      const rawBars: Bar[] = [
        [1000, 1, 2, 0.5, 1.5, 100],
        [2000, 1.5, 2.5, 1, 2, 150],
      ];
      vi.mocked(fetchMockTimeseries).mockResolvedValue(rawBars);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        provider: 'MOCK' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 2,
      });

      expect(result).toEqual({
        bars: rawBars,
        symbol: 'TEST',
        provider: 'MOCK',
        timeframe: '1h',
        source: 'NETWORK',
      });
    });

    it('handles MOEX provider with raw bars normalization', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      const rawBars: Bar[] = [
        [1000, 100, 110, 95, 105, 1000],
        [2000, 105, 115, 100, 110, 1200],
      ];
      vi.mocked(fetchMoexTimeseries).mockResolvedValue(rawBars);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'SBER',
        provider: 'MOEX' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 2,
      });

      expect(result).toEqual({
        bars: rawBars,
        symbol: 'SBER',
        provider: 'MOEX',
        timeframe: '1h',
        source: 'NETWORK',
      });
    });

    it('handles CUSTOM provider with mock generation', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      const mockBars: Bar[] = [
        [1000, 1, 2, 0.5, 1.5, 100],
        [2000, 1.5, 2.5, 1, 2, 150],
      ];
      vi.mocked(generateMockBarsRaw).mockReturnValue(mockBars);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'CUSTOM1',
        provider: 'CUSTOM' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 2,
      });

      expect(generateMockBarsRaw).toHaveBeenCalledWith({
        symbol: 'CUSTOM1',
        timeframe: '1h',
        limit: 2,
      });

      expect(result).toEqual({
        bars: mockBars,
        symbol: 'CUSTOM1',
        provider: 'CUSTOM',
        timeframe: '1h',
        source: 'NETWORK',
      });
    });
  });

  describe('error handling', () => {
    it('returns PROVIDER_ERROR when provider throws error', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockRejectedValue(
        new Error('Network error'),
      );

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 100,
      });

      expect(result).toEqual({
        code: 'PROVIDER_ERROR',
        message: 'Network error',
      });
    });

    it('handles normalization errors gracefully', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      // @ts-expect-error - testing invalid klines data
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue(null);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 100,
      });

      // Should still return PROVIDER_ERROR even for normalization issues
      expect(result).toEqual({
        code: 'PROVIDER_ERROR',
        message: expect.any(String),
      });
    });
  });

  describe('default values', () => {
    it('uses default provider when not specified', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([]);

      await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        // provider not specified
      });

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
    });

    it('uses default timeframe when not specified', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([]);

      await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        // timeframe not specified
      });

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
    });

    it('uses default limit when not specified', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([]);

      await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
        // limit not specified
      });

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
    });
  });
});

describe('searchAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear search cache between tests
    vi.mocked(normalizeCatalogResponse).mockClear();
  });

  it('returns empty array for short queries', async () => {
    const result = await searchAssets(dispatch, {
      query: 'a',
      provider: 'BINANCE' as Provider,
    });

    expect(result).toEqual([]);
    expect(normalizeCatalogResponse).not.toHaveBeenCalled();
  });

  it('returns empty array for empty query', async () => {
    const result = await searchAssets(dispatch, {
      query: '',
      provider: 'BINANCE' as Provider,
    });

    expect(result).toEqual([]);
  });

  it('uses cache for repeated searches', async () => {
    const mockItems: CatalogItem[] = [
      {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        provider: 'BINANCE' as Provider,
      },
    ];
    vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems);

    // First call
    const result1 = await searchAssets(dispatch, {
      query: 'BTC',
      provider: 'BINANCE' as Provider,
    });

    expect(result1).toEqual(mockItems);
    expect(normalizeCatalogResponse).toHaveBeenCalledTimes(1);

    // Second call with same parameters
    const result2 = await searchAssets(dispatch, {
      query: 'BTC',
      provider: 'BINANCE' as Provider,
    });

    expect(result2).toEqual(mockItems);
    // Should still be called only once due to caching
    expect(normalizeCatalogResponse).toHaveBeenCalledTimes(1);
  });

  it('searches MOEX assets', async () => {
    const mockItems: CatalogItem[] = [
      { symbol: 'SBER', name: 'Сбербанк', provider: 'MOEX' as Provider },
      { symbol: 'GAZP', name: 'Газпром', provider: 'MOEX' as Provider },
    ];
    vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems);

    const result = await searchAssets(dispatch, {
      query: 'Сбер',
      provider: 'MOEX' as Provider,
    });

    expect(normalizeCatalogResponse).toHaveBeenCalledWith(
      expect.any(Array),
      'MOEX',
    );
    expect(result).toEqual(mockItems);
  });

  it('handles cache expiration', async () => {
    const mockItems: CatalogItem[] = [
      {
        symbol: 'TEST',
        name: 'Test',
        provider: 'BINANCE' as Provider,
      },
    ];
    vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems);

    vi.useFakeTimers();

    // First call
    const result1 = await searchAssets(dispatch, {
      query: 'TEST',
      provider: 'BINANCE' as Provider,
    });

    // Advance time beyond TTL
    vi.advanceTimersByTime(40000);

    // Second call should refetch
    const result2 = await searchAssets(dispatch, {
      query: 'TEST',
      provider: 'BINANCE' as Provider,
    });

    expect(result1).toEqual(mockItems);
    expect(result2).toEqual(mockItems);
    // Should be called twice due to cache expiration
    expect(normalizeCatalogResponse).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

// ============================================================================
//                               SEARCH ASSETS
// ============================================================================

describe('searchAssets (MarketAdapter)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает пустой массив при пустом запросе', async () => {
    const result = await searchAssets(dispatch, {
      provider: 'MOCK' as any,
      query: '   ',
    });

    expect(result).toEqual([]);
    expect(searchMockSymbols).not.toHaveBeenCalled();
  });

  it('делает поиск по MOCK, нормализует данные и использует кэш', async () => {
    const raw = [
      {
        symbol: 'SBER',
        name: 'Sberbank',
        exchange: 'MOCKEX',
        class: 'stock',
        currency: 'RUB',
      },
      {
        // некорректная запись — должна быть отфильтрована
        symbol: '',
        name: 'Broken',
      },
    ];

    (searchMockSymbols as any).mockReturnValueOnce(raw);

    const firstResult = await searchAssets(dispatch, {
      provider: 'MOCK',
      query: 'Sber',
    });

    expect(searchMockSymbols).toHaveBeenCalledTimes(1);
    expect(searchMockSymbols).toHaveBeenCalledWith('Sber');

    // нормализация: один валидный элемент, assetClass берётся из class или 'other'
    expect(firstResult).toEqual([
      {
        symbol: 'SBER',
        name: 'Sberbank',
        exchange: 'MOCKEX',
        assetClass: 'stock',
        currency: 'RUB',
        provider: 'MOCK',
      },
    ]);

    // второй вызов с теми же параметрами должен использовать кэш и не дергать searchMockSymbols
    const secondResult = await searchAssets(dispatch, {
      provider: 'MOCK',
      query: 'Sber',
    });

    expect(searchMockSymbols).toHaveBeenCalledTimes(1);
    expect(secondResult).toEqual(firstResult);
  });

  it('прокидывает запросы к BINANCE и MOEX в соответствующие провайдеры', async () => {
    (searchBinanceSymbols as any).mockReturnValueOnce([{ any: 1 }]);
    (searchMoexSymbols as any).mockReturnValueOnce([{ any: 2 }]);

    await searchAssets(dispatch, {
      provider: 'BINANCE',
      query: 'btc',
    });

    await searchAssets(dispatch, {
      provider: 'MOEX',
      query: 'sber',
    });

    expect(searchBinanceSymbols).toHaveBeenCalledTimes(1);
    expect(searchBinanceSymbols).toHaveBeenCalledWith(dispatch, 'btc');

    expect(searchMoexSymbols).toHaveBeenCalledTimes(1);
    expect(searchMoexSymbols).toHaveBeenCalledWith(dispatch, 'sber');
  });

  it('поддерживает кастомный провайдер CUSTOM (возвращает пустой список)', async () => {
    const result = await searchAssets(dispatch, {
      provider: 'CUSTOM' as any,
      query: 'anything',
    });

    // сейчас normalizeCustomSymbols просто возвращает []
    expect(result).toEqual([]);
  });
});
