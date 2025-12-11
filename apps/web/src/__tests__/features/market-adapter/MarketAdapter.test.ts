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

vi.mock('@/features/market-adapter/providers/MockProvider', () => ({
  fetchMockTimeseries: vi.fn(),
  generateMockBarsRaw: vi.fn(),
}));

vi.mock('@/features/market-adapter/providers/MoexProvider', () => ({
  fetchMoexTimeseries: vi.fn(),
}));

// Мокаем функции нормализации
vi.mock('@/features/asset-catalog/lib/normalizeCatalogItem', () => ({
  normalizeCatalogResponse: vi.fn(() => []),
}));

// Мокаем схемы из @shared/schemas/market.schema
vi.mock('@shared/schemas/market.schema', () => {
  // Создаем мок для z.literal
  const createMockLiteral = (value: string) => {
    const mockLiteral = {
      optional: () => mockLiteral,
      or: (other: any) => mockLiteral,
      parse: (val: unknown) => {
        if (val === undefined) return value;
        if (val !== value) {
          throw new Error(`Invalid literal value: ${val}, expected: ${value}`);
        }
        return val;
      },
      safeParse: (val: unknown) => {
        try {
          const result = val === undefined ? value : val;
          if (val !== undefined && val !== value) {
            throw new Error(
              `Invalid literal value: ${val}, expected: ${value}`,
            );
          }
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      },
    };
    return mockLiteral;
  };

  // Создаем объект, который имитирует Zod схему с цепочкой вызовов
  const createMockSchema = (defaultValue?: any) => {
    const mockSchema = {
      optional: () => mockSchema,
      or: (other: any) => mockSchema,
      parse: (val: unknown) => {
        // Для тестов просто возвращаем значение или значение по умолчанию
        return val === undefined ? defaultValue : val;
      },
      safeParse: (val: unknown) => {
        // Имитация safeParse для валидации
        try {
          const result = val === undefined ? defaultValue : val;
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      },
    };
    return mockSchema;
  };

  return {
    zProvider: createMockSchema('BINANCE'),
    zTimeframe: createMockSchema('1h'),
    zSymbol: createMockSchema(''),
    // Экспортируем также createMockLiteral для использования в тестах
    createMockLiteral,
  };
});

// Мокаем zod полностью
vi.mock('zod', async () => {
  // Получаем реальный модуль, чтобы сохранить остальные функции
  const actual = await vi.importActual<typeof import('zod')>('zod');

  // Создаем мок для z.literal
  const mockLiteral = (value: string) => {
    const literalMock = {
      optional: () => literalMock,
      or: (other: any) => literalMock,
      parse: (val: unknown) => {
        if (val === undefined) return value;
        if (val !== value) {
          throw new Error(`Invalid literal value: ${val}, expected: ${value}`);
        }
        return val;
      },
      safeParse: (val: unknown) => {
        try {
          const result = val === undefined ? value : val;
          if (val !== undefined && val !== value) {
            throw new Error(
              `Invalid literal value: ${val}, expected: ${value}`,
            );
          }
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      },
    };
    return literalMock;
  };

  // Создаем мок для z.number()
  const mockNumber = () => {
    const numberMock = {
      int: () => numberMock,
      positive: () => numberMock,
      max: (max: number) => ({
        optional: () => ({
          parse: (val: unknown) => (val === undefined ? 100 : val),
          safeParse: (val: unknown) => {
            try {
              const result = val === undefined ? 100 : val;
              return { success: true, data: result };
            } catch (error) {
              return { success: false, error: error as Error };
            }
          },
        }),
        parse: (val: unknown) => {
          if (typeof val !== 'number' || val <= 0 || val > max) {
            throw new Error(`Invalid number, must be positive and <= ${max}`);
          }
          return val;
        },
        safeParse: (val: unknown) => {
          try {
            if (typeof val !== 'number' || val <= 0 || val > max) {
              throw new Error(`Invalid number, must be positive and <= ${max}`);
            }
            return { success: true, data: val };
          } catch (error) {
            return { success: false, error: error as Error };
          }
        },
      }),
    };
    return numberMock;
  };

  // Создаем мок для z.object()
  const mockObject = (schema: any) => ({
    parse: (val: unknown) => val,
    safeParse: (val: unknown) => ({ success: true, data: val }),
  });

  return {
    ...actual,
    z: {
      ...actual.z,
      literal: mockLiteral,
      number: mockNumber,
      object: mockObject,
    },
  };
});

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
    vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
    vi.mocked(fetchBinanceTimeseries).mockResolvedValue([]);
    vi.mocked(fetchMockTimeseries).mockResolvedValue([]);
    vi.mocked(fetchMoexTimeseries).mockResolvedValue([]);
    vi.mocked(generateMockBarsRaw).mockReturnValue([]);
  });

  describe('Поведение кэширования', () => {
    it('возвращает данные из кэша при их наличии', async () => {
      const cachedBars: Bar[] = [createTestBar(1000, 1, 2, 0.5, 1.5, 10)];
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(cachedBars);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
      });

      // Проверяем что результат успешный
      expect(result).toHaveProperty('bars');

      if ('bars' in result) {
        expect(result.bars).toEqual(cachedBars);
        expect(result.source).toBe('CACHE');
        expect(result.symbol).toBe('BTCUSDT');
      }

      expect(clientTimeseriesCache.get).toHaveBeenCalled();
      expect(fetchBinanceTimeseries).not.toHaveBeenCalled();
    });

    it('загружает данные из сети при отсутствии в кэше', async () => {
      const mockBars: Bar[] = [createTestBar(1000, 1, 2, 0.5, 1.5, 10)];
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([
        [1000, '1', '2', '0.5', '1.5', '10', 1100, '1', 10, '1', '1', '0'],
      ]);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        limit: 100,
      });

      // Проверяем что результат успешный
      expect(result).toHaveProperty('bars');

      if ('bars' in result) {
        expect(result.bars).toEqual(mockBars);
        expect(result.source).toBe('NETWORK');
        expect(result.provider).toBe('BINANCE');
      }

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
      expect(clientTimeseriesCache.set).toHaveBeenCalled();
    });
  });

  describe('Интеграция с разными провайдерами', () => {
    it('обрабатывает данные от Binance', async () => {
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([
        [
          1000,
          '1.0',
          '2.0',
          '0.5',
          '1.5',
          '100.0',
          1100,
          '1',
          10,
          '1',
          '1',
          '0',
        ],
      ]);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'ETHUSDT',
        provider: 'BINANCE',
        timeframe: '1h',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        const expectedBar: Bar = [1000, 1, 2, 0.5, 1.5, 100];
        expect(result.bars).toEqual([expectedBar]);
        expect(result.provider).toBe('BINANCE');
      }
    });

    it('обрабатывает данные от Mock провайдера', async () => {
      const rawBars: Bar[] = [createTestBar(1000, 1, 2, 0.5, 1.5, 100)];
      vi.mocked(fetchMockTimeseries).mockResolvedValue(rawBars);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        provider: 'MOCK',
        timeframe: '1h',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        expect(result.bars).toEqual(rawBars);
      }
      expect(fetchMockTimeseries).toHaveBeenCalled();
    });

    it('обрабатывает данные от MOEX провайдера', async () => {
      const rawBars: Bar[] = [createTestBar(1000, 100, 110, 95, 105, 1000)];
      vi.mocked(fetchMoexTimeseries).mockResolvedValue(rawBars);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'SBER',
        provider: 'MOEX',
        timeframe: '1h',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        expect(result.bars).toEqual(rawBars);
      }
      expect(fetchMoexTimeseries).toHaveBeenCalled();
    });
  });

  describe('Обработка ошибок', () => {
    it('возвращает ошибку провайдера при сбое запроса', async () => {
      vi.mocked(fetchBinanceTimeseries).mockRejectedValue(
        new Error('Network error'),
      );

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
      });

      expect(result).toHaveProperty('code', 'PROVIDER_ERROR');
      expect(result).toHaveProperty('message', 'Network error');
    });
  });

  describe('Значения по умолчанию', () => {
    it('использует значения по умолчанию если не указаны', async () => {
      await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
      });

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
    });
  });

  describe('Нормализация данных', () => {
    it('корректно нормализует строковые значения от Binance', async () => {
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
      ]);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE',
        limit: 2,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        const expectedBars: Bar[] = [
          [1000, 1.5, 2.5, 1.0, 2.0, 150.5],
          [2000, 2.0, 3.0, 1.5, 2.5, 200.75],
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
    vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems as any);

    const result = await searchAssets(dispatch, {
      query: 'BTC',
      provider: 'BINANCE',
    });

    expect(result).toEqual(mockItems);
    expect(normalizeCatalogResponse).toHaveBeenCalled();
  });

  it('выполняет поиск по MOEX активам', async () => {
    const mockItems = [
      { symbol: 'SBER', name: 'Сбербанк', provider: 'MOEX' },
      { symbol: 'GAZP', name: 'Газпром', provider: 'MOEX' },
    ];
    vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems as any);

    const result = await searchAssets(dispatch, {
      query: 'Сбер',
      provider: 'MOEX',
    });

    expect(result).toEqual(mockItems);
  });

  it('возвращает полный список активов для пустого запроса', async () => {
    const mockItems = [
      { symbol: 'BTCUSDT', provider: 'BINANCE' },
      { symbol: 'ETHUSDT', provider: 'BINANCE' },
    ];
    vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems as any);

    const result = await searchAssets(dispatch, {
      query: '',
      provider: 'BINANCE',
    });

    expect(result).toEqual(mockItems);
    expect(normalizeCatalogResponse).toHaveBeenCalled();
  });
});
