// apps/web/src/__tests__/features/market-adapter/MarketAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppDispatch } from '@/shared/store';

// Используем vi.hoisted для создания моков, которые будут доступны при hoisting'е
const {
  mockFetchBinanceTimeseries,
  mockFetchMoexTimeseries,
  mockFetchMockTimeseries,
  mockGenerateMockBarsRaw,
  mockSearchBinanceSymbols,
  mockFetchBinanceExchangeInfo,
  mockSearchMoexSymbols,
  mockSearchMockSymbols,
} = vi.hoisted(() => ({
  mockFetchBinanceTimeseries: vi.fn(),
  mockFetchMoexTimeseries: vi.fn(),
  mockFetchMockTimeseries: vi.fn(),
  mockGenerateMockBarsRaw: vi.fn(),
  mockSearchBinanceSymbols: vi.fn(),
  mockFetchBinanceExchangeInfo: vi.fn(),
  mockSearchMoexSymbols: vi.fn(),
  mockSearchMockSymbols: vi.fn(),
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
  searchBinanceSymbols: mockSearchBinanceSymbols,
  fetchBinanceExchangeInfo: mockFetchBinanceExchangeInfo,
}));

vi.mock('@/features/market-adapter/providers/MoexProvider', () => ({
  fetchMoexTimeseries: mockFetchMoexTimeseries,
  searchMoexSymbols: mockSearchMoexSymbols,
}));

vi.mock('@/features/market-adapter/providers/MockProvider', () => ({
  fetchMockTimeseries: mockFetchMockTimeseries,
  generateMockBarsRaw: mockGenerateMockBarsRaw,
  searchMockSymbols: mockSearchMockSymbols,
  MOCK_SYMBOLS: [
    {
      symbol: 'MOCK1',
      name: 'Mock Asset 1',
      exchange: 'MOCKEX',
      assetClass: 'crypto',
      currency: 'USD',
    },
    {
      symbol: 'MOCK2',
      name: 'Mock Asset 2',
      exchange: 'MOCKEX',
      assetClass: 'equity',
      currency: 'USD',
    },
  ],
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

    it('обрабатывает свечи MOEX в формате candles', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);

      const ts = '2024-01-02T00:00:00Z';
      mockFetchMoexTimeseries.mockResolvedValue({
        candles: {
          columns: ['end', 'open', 'high', 'low', 'close', 'value'],
          data: [[ts, 10, 12, 9, 11, 500]],
        },
      } as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'SBER',
        provider: 'MOEX',
        timeframe: '1d',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        expect(result.bars).toEqual([[Date.parse(ts), 10, 12, 9, 11, 500]]);
      }
    });

    it('нормализует MOEX свечи без таймзоны как UTC', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);

      const ts = '2024-01-02 00:00:00';
      mockFetchMoexTimeseries.mockResolvedValue({
        candles: {
          columns: ['begin', 'open', 'high', 'low', 'close', 'volume'],
          data: [[ts, 10, 12, 9, 11, 500]],
        },
      } as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'SBER',
        provider: 'MOEX',
        timeframe: '1d',
        limit: 1,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        expect(result.bars).toEqual([
          [Date.parse('2024-01-02T00:00:00Z'), 10, 12, 9, 11, 500],
        ]);
      }
    });

    it('возвращает пустые бары при невалидных данных от MOCK провайдера', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      mockFetchMockTimeseries.mockResolvedValue('not-an-array' as any);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        provider: 'MOCK',
        timeframe: '1h',
        limit: 2,
      });

      expect(result).toHaveProperty('bars');
      if ('bars' in result) {
        expect(result.bars).toEqual([]);
        expect(result.source).toBe('LOCAL');
      }
    });
  });

  describe('Обработка ошибок', () => {
    it('возвращает ошибку провайдера при сбое запроса', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      mockFetchBinanceTimeseries.mockRejectedValue(new Error('Network error'));

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
    mockSearchBinanceSymbols.mockResolvedValue([]);
    mockFetchBinanceExchangeInfo.mockResolvedValue({ symbols: [] });
    mockSearchMoexSymbols.mockResolvedValue([]);
    mockSearchMockSymbols.mockResolvedValue([
      {
        symbol: 'MOCK1',
        name: 'Mock Asset 1',
        exchange: 'MOCKEX',
        assetClass: 'crypto',
        currency: 'USD',
      },
    ] as any);
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

    mockSearchBinanceSymbols.mockResolvedValue([
      { symbol: 'BTCUSDT' },
      { symbol: 'ETHUSDT' },
    ]);

    const result = await searchAssets(dispatch, {
      mode: 'search',
      query: 'BTC',
      provider: 'BINANCE',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('BTCUSDT');
    expect(result[1].symbol).toBe('ETHUSDT');
    expect(mockSearchBinanceSymbols).toHaveBeenCalledWith(
      dispatch,
      'BTC',
      expect.any(Object),
    );
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

    mockSearchMoexSymbols.mockResolvedValue([
      { SECID: 'SBER' },
      { SECID: 'GAZP' },
    ]);

    const result = await searchAssets(dispatch, {
      mode: 'search',
      query: 'SBER',
      provider: 'MOEX',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('SBER');
    expect(result[1].symbol).toBe('GAZP');
    expect(mockSearchMoexSymbols).toHaveBeenCalledWith(
      dispatch,
      'SBER',
      expect.any(Object),
    );
  });

  it('использует listAll при пустом запросе для Binance (fallback)', async () => {
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

    mockFetchBinanceExchangeInfo.mockResolvedValue({
      symbols: [{ symbol: 'BTCUSDT' }, { symbol: 'ETHUSDT' }],
    });

    const result = await searchAssets(dispatch, {
      mode: 'search',
      query: '',
      provider: 'BINANCE',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(mockFetchBinanceExchangeInfo).toHaveBeenCalled();
  });

  it('использует listAll при пустом запросе для MOEX (fallback)', async () => {
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

    mockSearchMoexSymbols.mockResolvedValue([
      { SECID: 'SBER' },
      { SECID: 'GAZP' },
    ]);

    const result = await searchAssets(dispatch, {
      mode: 'search',
      query: '',
      provider: 'MOEX',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(mockSearchMoexSymbols).toHaveBeenCalledWith(
      dispatch,
      '',
      expect.any(Object),
    );
  });

  it('возвращает пустой массив для неизвестного провайдера', async () => {
    const result = await searchAssets(dispatch, {
      mode: 'search',
      query: 'TEST',
      provider: 'UNKNOWN' as any,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('возвращает все активы в режиме listAll', async () => {
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
      {
        symbol: 'BNBUSDT',
        name: 'BNB/USDT',
        provider: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        exchange: 'BINANCE',
      },
    ] as any);

    mockFetchBinanceExchangeInfo.mockResolvedValue({
      symbols: [
        { symbol: 'BTCUSDT' },
        { symbol: 'ETHUSDT' },
        { symbol: 'BNBUSDT' },
      ],
    });

    const result = await searchAssets(dispatch, {
      mode: 'listAll',
      provider: 'BINANCE',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(mockFetchBinanceExchangeInfo).toHaveBeenCalled();
  });

  it('возвращает все активы MOEX в режиме listAll', async () => {
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

    mockSearchMoexSymbols.mockResolvedValue([
      { SECID: 'SBER' },
      { SECID: 'GAZP' },
    ]);

    const result = await searchAssets(dispatch, {
      mode: 'listAll',
      provider: 'MOEX',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(mockSearchMoexSymbols).toHaveBeenCalledWith(
      dispatch,
      '',
      expect.any(Object),
    );
  });

  it('ограничивает количество активов в режиме listAll с limit', async () => {
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

    mockFetchBinanceExchangeInfo.mockResolvedValue({
      symbols: [{ symbol: 'BTCUSDT' }, { symbol: 'ETHUSDT' }],
    });

    const result = await searchAssets(dispatch, {
      mode: 'listAll',
      provider: 'BINANCE',
      limit: 2,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(mockFetchBinanceExchangeInfo).toHaveBeenCalled();
  });

  it('работает с MOCK провайдером в режиме search', async () => {
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'MOCK1',
        name: 'Mock Asset 1',
        provider: 'MOCK',
        assetClass: 'mock',
        currency: 'USD',
        exchange: 'MOCK',
      },
    ] as any);

    mockSearchMockSymbols.mockResolvedValue([
      {
        symbol: 'MOCK1',
        name: 'Mock Asset 1',
        exchange: 'MOCKEX',
        assetClass: 'crypto',
        currency: 'USD',
      },
    ] as any);

    const result = await searchAssets(dispatch, {
      mode: 'search',
      query: 'MOCK',
      provider: 'MOCK',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].provider).toBe('MOCK');
    expect(mockSearchMockSymbols).toHaveBeenCalledWith(
      'MOCK',
      expect.any(Object),
    );
  });

  it('работает с MOCK провайдером в режиме listAll', async () => {
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'MOCK1',
        name: 'Mock Asset 1',
        provider: 'MOCK',
        assetClass: 'mock',
        currency: 'USD',
        exchange: 'MOCK',
      },
      {
        symbol: 'MOCK2',
        name: 'Mock Asset 2',
        provider: 'MOCK',
        assetClass: 'mock',
        currency: 'USD',
        exchange: 'MOCK',
      },
    ] as any);

    const result = await searchAssets(dispatch, {
      mode: 'listAll',
      provider: 'MOCK',
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result.every((item) => item.provider === 'MOCK')).toBe(true);
  });

  it('использует кэш при повторном поиске', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
    mockSearchBinanceSymbols.mockResolvedValue([{ symbol: 'CACHED' }]);
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'CACHED',
        name: 'Cached',
        provider: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        exchange: 'BINANCE',
      },
    ] as any);

    const first = await searchAssets(dispatch, {
      mode: 'search',
      query: 'CACHE_TEST',
      provider: 'BINANCE',
    });
    const second = await searchAssets(dispatch, {
      mode: 'search',
      query: 'CACHE_TEST',
      provider: 'BINANCE',
    });

    expect(first).toEqual(second);
    expect(mockSearchBinanceSymbols).toHaveBeenCalledTimes(1);
    nowSpy.mockRestore();
  });

  it('нормализует ответ MOEX с securities', async () => {
    const response = {
      securities: {
        columns: ['SECID', 'SHORTNAME'],
        data: [['SBER', 'Sberbank']],
      },
    };
    mockSearchMoexSymbols.mockResolvedValue(response as any);

    await searchAssets(dispatch, {
      mode: 'search',
      query: 'SBER_SECURITIES',
      provider: 'MOEX',
    });

    expect(mockSearchMoexSymbols).toHaveBeenCalledWith(
      dispatch,
      'SBER_SECURITIES',
      expect.any(Object),
    );
    expect(normalizeCatalogResponse).toHaveBeenCalledWith(
      [{ SECID: 'SBER', SHORTNAME: 'Sberbank' }],
      'MOEX',
    );
  });

  it('использует MOCK_SYMBOLS для пустого запроса в search', async () => {
    vi.mocked(normalizeCatalogResponse).mockReturnValue([
      {
        symbol: 'MOCK1',
        name: 'Mock Asset 1',
        provider: 'MOCK',
        assetClass: 'crypto',
        currency: 'USD',
        exchange: 'MOCKEX',
      },
      {
        symbol: 'MOCK2',
        name: 'Mock Asset 2',
        provider: 'MOCK',
        assetClass: 'equity',
        currency: 'USD',
        exchange: 'MOCKEX',
      },
    ] as any);

    const result = await searchAssets(dispatch, {
      mode: 'search',
      query: '',
      provider: 'MOCK',
    });

    expect(result.length).toBe(2);
    expect(mockSearchMockSymbols).not.toHaveBeenCalled();
  });
});
