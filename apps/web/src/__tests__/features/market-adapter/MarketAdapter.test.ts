// apps/web/src/__tests__/features/market-adapter/MarketAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppDispatch } from '@/shared/store';

// Используем vi.hoisted для создания моков, которые будут доступны при hoisting'е
const {
  mockFetchBinanceTimeseries,
  mockFetchMoexTimeseries,
  mockFetchMockTimeseries,
  mockGenerateMockBarsRaw,
} = vi.hoisted(() => ({
  mockFetchBinanceTimeseries: vi.fn(),
  mockFetchMoexTimeseries: vi.fn(),
  mockFetchMockTimeseries: vi.fn(),
  mockGenerateMockBarsRaw: vi.fn(),
}));

// Сначала мокаем всё что нужно, ЗАТЕМ импортируем
vi.mock('@/config/market', () => ({
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

// Мокаем провайдеры с использованием hoisted моков
vi.mock('@/features/market-adapter/providers/BinanceProvider', () => ({
  fetchBinanceTimeseries: mockFetchBinanceTimeseries,
}));

vi.mock('@/features/market-adapter/providers/MoexProvider', () => ({
  fetchMoexTimeseries: mockFetchMoexTimeseries,
}));

vi.mock('@/features/market-adapter/providers/MockProvider', () => ({
  fetchMockTimeseries: mockFetchMockTimeseries,
  generateMockBarsRaw: mockGenerateMockBarsRaw,
}));

// Импортируем после моков
import {
  getMarketTimeseries,
  searchAssets,
} from '@/features/market-adapter/MarketAdapter';
import {
  clientTimeseriesCache,
  makeTimeseriesCacheKey,
} from '@/features/market-adapter/cache/ClientTimeseriesCache';

vi.mock('@/features/asset-catalog/lib/normalizeCatalogItem', () => ({
  normalizeCatalogResponse: vi.fn(() => []),
}));
import { normalizeCatalogResponse } from '@/features/asset-catalog/lib/normalizeCatalogItem';

const dispatch = vi.fn() as unknown as AppDispatch;

// Определяем тип Bar на основе кода из MarketAdapter.ts
type Bar = [number, number, number, number, number, number?];

// Вспомогательная функция для создания тестовых баров
const createTestBar = (
    timestamp: number,
    open: number,
    high: number,
    low: number,
    close: number,
    volume?: number,
): Bar => [timestamp, open, high, low, close, volume];

describe('MarketAdapter - Получение временных рядов (getMarketTimeseries)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Поведение кэширования', () => {
    it('возвращает данные из кэша при наличии', async () => {
      const cachedBars: Bar[] = [createTestBar(1000, 1, 2, 0.5, 1.5, 10)];
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(cachedBars);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        limit: 100,
      });

      expect(makeTimeseriesCacheKey).toHaveBeenCalledWith(
          'BINANCE',
          'BTCUSDT',
          '1h',
          100,
      );
      expect(clientTimeseriesCache.get).toHaveBeenCalled();
      expect(mockFetchBinanceTimeseries).not.toHaveBeenCalled();

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        expect(result.bars).toEqual(cachedBars);
        expect(result.source).toBe('CACHE');
      }
    });

    it('загружает данные из сети при отсутствии в кэше', async () => {
      // адаптер приводит секунды -> миллисекунды
      const mockBars: Bar[] = [createTestBar(1_000_000, 1, 2, 0.5, 1.5, 10)];

      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);

      // Binance kline openTime=1000 (сек) -> 1_000_000 (мс)
      mockFetchBinanceTimeseries.mockResolvedValue([
        [1000, '1', '2', '0.5', '1.5', '10', 1100, '1', 10, '1', '1', '0'],
      ] as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        limit: 100,
      });

      expect(clientTimeseriesCache.get).toHaveBeenCalled();
      expect(mockFetchBinanceTimeseries).toHaveBeenCalled();
      expect(clientTimeseriesCache.set).toHaveBeenCalled();

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        expect(result.bars).toEqual(mockBars);
        expect(result.source).toBe('NETWORK');
        expect(result.provider).toBe('BINANCE');
      }
    });
  });

  describe('Интеграция с разными провайдерами', () => {
    it('обрабатывает данные от Binance', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      mockFetchBinanceTimeseries.mockResolvedValue([
        [1000, '1', '2', '0.5', '1.5', '100', 1100, '1', 10, '1', '1', '0'],
      ] as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'ETHUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        const expectedBar: Bar = [1_000_000, 1, 2, 0.5, 1.5, 100];
        expect(result.bars).toEqual([expectedBar]);
        expect(result.provider).toBe('BINANCE');
      }
    });

    it('обрабатывает данные от Mock провайдера', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);

      // вход может быть секундами -> адаптер приведёт к ms
      const rawBars: Bar[] = [createTestBar(1000, 1, 2, 0.5, 1.5, 100)];
      mockFetchMockTimeseries.mockResolvedValue(rawBars as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        provider: 'MOCK',
        timeframe: '1h',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        const expectedBars: Bar[] = [
          createTestBar(1_000_000, 1, 2, 0.5, 1.5, 100),
        ];
        expect(result.bars).toEqual(expectedBars);
      }
      expect(mockFetchMockTimeseries).toHaveBeenCalled();
    });

    it('обрабатывает данные от MOEX провайдера', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);

      const rawBars: Bar[] = [createTestBar(1000, 100, 110, 95, 105, 1000)];
      mockFetchMoexTimeseries.mockResolvedValue(rawBars as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'SBER',
        provider: 'MOEX',
        timeframe: '1h',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        const expectedBars: Bar[] = [
          createTestBar(1_000_000, 100, 110, 95, 105, 1000),
        ];
        expect(result.bars).toEqual(expectedBars);
      }
      expect(mockFetchMoexTimeseries).toHaveBeenCalled();
    });

    it('обрабатывает данные от CUSTOM провайдера', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);

      mockGenerateMockBarsRaw.mockReturnValue([[1000, 1, 2, 0.5, 1.5, 100]] as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'CUSTOM',
        provider: 'CUSTOM',
        timeframe: '1h',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        const expectedBars: Bar[] = [
          createTestBar(1_000_000, 1, 2, 0.5, 1.5, 100),
        ];
        expect(result.bars).toEqual(expectedBars);
      }
      expect(mockGenerateMockBarsRaw).toHaveBeenCalled();
    });
  });

  describe('Обработка ошибок', () => {
    it('возвращает ошибку провайдера при сбое запроса', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      mockFetchBinanceTimeseries.mockRejectedValue(
          new Error('Network error'),
      );

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        limit: 100,
      });

      expect(result).toHaveProperty('code');
      if (!('bars' in result)) {
        expect(result.code).toBe('PROVIDER_ERROR');
        expect(result.message).toBe('Network error');
      }
    });

    it('возвращает ошибку INVALID_PARAMS при невалидных данных', async () => {
      // Передаем невалидные данные
      const result = await getMarketTimeseries(dispatch, {
        symbol: '', // Пустой символ
        provider: 'BINANCE',
        timeframe: '1h',
        limit: 100,
      } as any);

      expect(result).toHaveProperty('code');
      if (!('bars' in result)) {
        expect(result.code).toBe('INVALID_PARAMS');
      }
    });
  });

  describe('Нормализация данных', () => {
    it('корректно нормализует строковые значения от Binance', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      mockFetchBinanceTimeseries.mockResolvedValue([
        [
          1000,
          '1.5',
          '2.5',
          '1.0',
          '2.0',
          '150.5',
          1100,
          '1',
          10,
          '1',
          '1',
          '0',
        ],
        [
          2000,
          '2.0',
          '3.0',
          '1.5',
          '2.5',
          '200.75',
          2100,
          '1',
          10,
          '1',
          '1',
          '0',
        ],
      ] as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        limit: 2,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        // ts в ms
        const expectedBars: Bar[] = [
          [1_000_000, 1.5, 2.5, 1.0, 2.0, 150.5],
          [2_000_000, 2.0, 3.0, 1.5, 2.5, 200.75],
        ];
        expect(result.bars).toEqual(expectedBars);
      }
    });

    it('нормализует timestamp к миллисекундам', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      mockFetchBinanceTimeseries.mockResolvedValue([
        [
          1000, // секунды
          '1',
          '2',
          '0.5',
          '1.5',
          '10',
          1100,
          '1',
          10,
          '1',
          '1',
          '0',
        ],
      ] as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        provider: 'BINANCE',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        expect(result.bars[0][0]).toBe(1_000_000); // должно быть в миллисекундах
      }
    });

    it('сортирует бары по времени', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      mockFetchBinanceTimeseries.mockResolvedValue([
        [2000, '2', '3', '1.5', '2.5', '20', 2100, '1', 10, '1', '1', '0'],
        [1000, '1', '2', '0.5', '1.5', '10', 1100, '1', 10, '1', '1', '0'],
      ] as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        provider: 'BINANCE',
        limit: 2,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        // Должны быть отсортированы по возрастанию
        expect(result.bars[0][0]).toBeLessThan(result.bars[1][0]);
        expect(result.bars[0][0]).toBe(1_000_000);
        expect(result.bars[1][0]).toBe(2_000_000);
      }
    });

    it('убирает дубликаты по времени', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      mockFetchBinanceTimeseries.mockResolvedValue([
        [1000, '1', '2', '0.5', '1.5', '10', 1100, '1', 10, '1', '1', '0'],
        [1000, '1.5', '2.5', '1.0', '2.0', '15', 1100, '1', 10, '1', '1', '0'], // Дубликат по времени
        [2000, '2', '3', '1.5', '2.5', '20', 2100, '1', 10, '1', '1', '0'],
      ] as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        provider: 'BINANCE',
        limit: 3,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        // Должно быть 2 бара вместо 3
        expect(result.bars).toHaveLength(2);
        expect(result.bars[0][0]).toBe(1_000_000);
        expect(result.bars[1][0]).toBe(2_000_000);
      }
    });
  });
});

describe('MarketAdapter - Поиск активов (searchAssets)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(normalizeCatalogResponse).mockClear();
    vi.mocked(normalizeCatalogResponse).mockReturnValue([]);
  });

  it('возвращает результат поиска для Binance', async () => {
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'BTCUSDT',
        name: 'BTC/USDT',
        provider: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        exchange: 'BINANCE',
      },
      {
        symbol: 'ETHUSDT',
        name: 'ETH/USDT',
        provider: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        exchange: 'BINANCE',
      },
    ] as any);

    const result = await searchAssets(dispatch, {
      query: 'BTC',
      provider: 'BINANCE',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('BTCUSDT');
    expect(result[1].symbol).toBe('ETHUSDT');
  });

  it('возвращает результат поиска для MOEX', async () => {
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'SBER',
        name: 'Сбербанк',
        provider: 'MOEX',
        assetClass: 'equity',
        currency: 'RUB',
        exchange: 'MOEX',
      },
      {
        symbol: 'GAZP',
        name: 'Газпром',
        provider: 'MOEX',
        assetClass: 'equity',
        currency: 'RUB',
        exchange: 'MOEX',
      },
    ] as any);

    const result = await searchAssets(dispatch, {
      query: 'SBER',
      provider: 'MOEX',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('SBER');
    expect(result[1].symbol).toBe('GAZP');
  });

  it('возвращает все активы при пустом запросе для Binance', async () => {
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'BTCUSDT',
        name: 'BTC/USDT',
        provider: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        exchange: 'BINANCE',
      },
      {
        symbol: 'ETHUSDT',
        name: 'ETH/USDT',
        provider: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        exchange: 'BINANCE',
      },
    ] as any);

    const result = await searchAssets(dispatch, {
      query: '',
      provider: 'BINANCE',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('возвращает все активы при пустом запросе для MOEX', async () => {
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'SBER',
        name: 'Сбербанк',
        provider: 'MOEX',
        assetClass: 'equity',
        currency: 'RUB',
        exchange: 'MOEX',
      },
      {
        symbol: 'GAZP',
        name: 'Газпром',
        provider: 'MOEX',
        assetClass: 'equity',
        currency: 'RUB',
        exchange: 'MOEX',
      },
    ] as any);

    const result = await searchAssets(dispatch, {
      query: '',
      provider: 'MOEX',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('возвращает пустой массив для неизвестного провайдера', async () => {
    const result = await searchAssets(dispatch, {
      query: 'TEST',
      provider: 'UNKNOWN' as any,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('обрабатывает регистр символов при поиске', async () => {
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'BTCUSDT',
        name: 'BTC/USDT',
        provider: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        exchange: 'BINANCE',
      },
    ] as any);

    // Поиск в разных регистрах
    const result1 = await searchAssets(dispatch, {
      query: 'btc',
      provider: 'BINANCE',
    });

    const result2 = await searchAssets(dispatch, {
      query: 'BTC',
      provider: 'BINANCE',
    });

    const result3 = await searchAssets(dispatch, {
      query: 'Btc',
      provider: 'BINANCE',
    });

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });
});