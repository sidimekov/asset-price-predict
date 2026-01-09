// apps/web/src/__tests__/features/market-adapter/MarketAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppDispatch } from '@/shared/store';

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

// Мокаем провайдеры
vi.mock('@/features/market-adapter/providers/BinanceProvider', () => ({
  fetchBinanceTimeseries: vi.fn(),
}));

vi.mock('@/features/market-adapter/providers/MoexProvider', () => ({
  fetchMoexTimeseries: vi.fn(),
}));

vi.mock('@/features/market-adapter/providers/MockProvider', () => ({
  fetchMockTimeseries: vi.fn(),
  generateMockBarsRaw: vi.fn(),
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
import { fetchBinanceTimeseries } from '@/features/market-adapter/providers/BinanceProvider';
import { fetchMoexTimeseries } from '@/features/market-adapter/providers/MoexProvider';
import { fetchMockTimeseries } from '@/features/market-adapter/providers/MockProvider';

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
      expect(fetchBinanceTimeseries).not.toHaveBeenCalled();

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
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([
        [1000, '1', '2', '0.5', '1.5', '10', 1100, '1', 10, '1', '1', '0'],
      ] as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        limit: 100,
      });

      expect(clientTimeseriesCache.get).toHaveBeenCalled();
      expect(fetchBinanceTimeseries).toHaveBeenCalled();
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
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([
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
      vi.mocked(fetchMockTimeseries).mockResolvedValue(rawBars as any);

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
      expect(fetchMockTimeseries).toHaveBeenCalled();
    });

    it('обрабатывает данные от MOEX провайдера', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);

      const rawBars: Bar[] = [createTestBar(1000, 100, 110, 95, 105, 1000)];
      vi.mocked(fetchMoexTimeseries).mockResolvedValue(rawBars as any);

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
      expect(fetchMoexTimeseries).toHaveBeenCalled();
    });
  });

  describe('Обработка ошибок', () => {
    it('возвращает ошибку провайдера при сбое запроса', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockRejectedValue(
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
      }
    });
  });

  describe('Нормализация данных', () => {
    it('корректно нормализует строковые значения от Binance', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([
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
  });
});

describe('MarketAdapter - Поиск активов (searchAssets)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(normalizeCatalogResponse).mockClear();
    vi.mocked(normalizeCatalogResponse).mockReturnValue([]);
  });

  it('возвращает результат поиска', async () => {
    const mockItems = [
      { symbol: 'BTCUSDT', provider: 'BINANCE' },
      { symbol: 'ETHUSDT', provider: 'BINANCE' },
    ];

    // searchAssets внутри адаптера использует normalizeCatalogResponse
    vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems as any);

    const result = await searchAssets(dispatch, {
      query: 'BTC',
      provider: 'BINANCE',
    } as any);

    expect(Array.isArray(result)).toBe(true);
  });
});
