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

// Типы
type Bar = [number, number, number, number, number, number];

// Вспомогательные функции
const createMockBinanceKline = (
  time: number,
  open: string,
  high: string,
  low: string,
  close: string,
  volume: string,
): BinanceKline => [
  time,
  open,
  high,
  low,
  close,
  volume,
  time + 1000,
  '1.0',
  10,
  '1.0',
  '1.0',
  '0',
];

const dispatch = vi.fn() as unknown as AppDispatch;

describe('MarketAdapter - Получение временных рядов', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Валидация параметров', () => {
    it('возвращает ошибку при пустом символе', async () => {
      const result = await getMarketTimeseries(dispatch, { symbol: '' });

      expect(result).toEqual({
        code: 'INVALID_PARAMS',
        message: 'Invalid request',
      });
    });

    it('возвращает ошибку при неверном провайдере', async () => {
      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        // @ts-expect-error - тестируем неверный провайдер
        provider: 'INVALID',
      });

      expect(result).toEqual({
        code: 'INVALID_PARAMS',
        message: 'Invalid request',
      });
    });

    it('возвращает ошибку при неверном таймфрейме', async () => {
      const result = await getMarketTimeseries(dispatch, {
        symbol: 'TEST',
        // @ts-expect-error - тестируем неверный таймфрейм
        timeframe: 'INVALID',
      });

      expect(result).toEqual({
        code: 'INVALID_PARAMS',
        message: 'Invalid request',
      });
    });

    it('возвращает ошибку при неверном лимите', async () => {
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

  describe('Поведение кэширования', () => {
    it('возвращает данные из кэша при их наличии', async () => {
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

    it('загружает данные из сети при отсутствии в кэше', async () => {
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

  describe('Интеграция с провайдерами', () => {
    it('обрабатывает данные от Binance с нормализацией', async () => {
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

    it('обрабатывает данные от Mock провайдера', async () => {
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

    it('обрабатывает данные от MOEX провайдера', async () => {
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

    it('обрабатывает CUSTOM провайдер с генерацией моковых данных', async () => {
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

  describe('Обработка ошибок', () => {
    it('возвращает ошибку провайдера при сбое запроса', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockRejectedValue(
        new Error('Ошибка сети'),
      );

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 100,
      });

      expect(result).toEqual({
        code: 'PROVIDER_ERROR',
        message: 'Ошибка сети',
      });
    });

    it('корректно обрабатывает ошибки нормализации', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      // @ts-expect-error - тестируем некорректные данные
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue(null);

      const result = await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
        limit: 100,
      });

      expect(result).toEqual({
        code: 'PROVIDER_ERROR',
        message: expect.any(String),
      });
    });
  });

  describe('Значения по умолчанию', () => {
    it('использует провайдер по умолчанию если не указан', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([]);

      await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
      });

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
    });

    it('использует таймфрейм по умолчанию если не указан', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([]);

      await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
      });

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
    });

    it('использует лимит по умолчанию если не указан', async () => {
      vi.mocked(clientTimeseriesCache.get).mockReturnValue(null);
      vi.mocked(fetchBinanceTimeseries).mockResolvedValue([]);

      await getMarketTimeseries(dispatch, {
        symbol: 'BTCUSDT',
        provider: 'BINANCE' as Provider,
        timeframe: '1h' as Timeframe,
      });

      expect(fetchBinanceTimeseries).toHaveBeenCalledWith(dispatch, {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        limit: 100,
      });
    });
  });
});

describe('MarketAdapter - Поиск активов', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(normalizeCatalogResponse).mockClear();
  });

  describe('Базовые сценарии', () => {
    it('возвращает пустой массив для коротких запросов', async () => {
      const result = await searchAssets(dispatch, {
        query: 'a',
        provider: 'BINANCE' as Provider,
      });

      expect(result).toEqual([]);
      expect(normalizeCatalogResponse).not.toHaveBeenCalled();
    });

    it('возвращает пустой массив для пустого запроса', async () => {
      const result = await searchAssets(dispatch, {
        query: '',
        provider: 'BINANCE' as Provider,
      });

      expect(result).toEqual([]);
    });

    it('использует кэш для повторных поисков', async () => {
      const mockItems: CatalogItem[] = [
        {
          symbol: 'BTCUSDT',
          name: 'Bitcoin',
          provider: 'BINANCE' as Provider,
        },
      ];
      vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems);

      // Первый вызов
      const result1 = await searchAssets(dispatch, {
        query: 'BTC',
        provider: 'BINANCE' as Provider,
      });

      expect(result1).toEqual(mockItems);
      expect(normalizeCatalogResponse).toHaveBeenCalledTimes(1);

      // Второй вызов с теми же параметрами
      const result2 = await searchAssets(dispatch, {
        query: 'BTC',
        provider: 'BINANCE' as Provider,
      });

      expect(result2).toEqual(mockItems);
      // Должен быть вызван только один раз из-за кэширования
      expect(normalizeCatalogResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Поиск по разным провайдерам', () => {
    it('выполняет поиск по MOEX активам', async () => {
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
  });

  describe('Истечение срока действия кэша', () => {
    it('обновляет данные при истечении TTL', async () => {
      const mockItems: CatalogItem[] = [
        {
          symbol: 'TEST',
          name: 'Test',
          provider: 'BINANCE' as Provider,
        },
      ];
      vi.mocked(normalizeCatalogResponse).mockReturnValue(mockItems);

      vi.useFakeTimers();

      // Первый вызов
      const result1 = await searchAssets(dispatch, {
        query: 'TEST',
        provider: 'BINANCE' as Provider,
      });

      // Перемещаем время вперед за пределы TTL
      vi.advanceTimersByTime(40000);

      // Второй вызов должен выполнить новый запрос
      const result2 = await searchAssets(dispatch, {
        query: 'TEST',
        provider: 'BINANCE' as Provider,
      });

      expect(result1).toEqual(mockItems);
      expect(result2).toEqual(mockItems);
      // Должен быть вызван дважды из-за истечения кэша
      expect(normalizeCatalogResponse).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});
