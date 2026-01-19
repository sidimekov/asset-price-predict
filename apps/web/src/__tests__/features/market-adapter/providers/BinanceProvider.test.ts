// apps/web/src/__tests__/features/market-adapter/providers/BinanceProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchBinanceTimeseries,
  fetchBinanceExchangeInfo,
  searchBinanceSymbols,
} from '@/features/market-adapter/providers/BinanceProvider';

// хостим мок до vi.mock
const {
  mockBinanceInitiate,
  mockBinanceSearchInitiate,
  mockBinanceExchangeInfoInitiate,
} = vi.hoisted(() => ({
  mockBinanceInitiate: vi.fn(),
  mockBinanceSearchInitiate: vi.fn(),
  mockBinanceExchangeInfoInitiate: vi.fn(),
}));

vi.mock('@/shared/api/marketApi', () => ({
  __esModule: true,
  marketApi: {
    endpoints: {
      getBinanceTimeseries: {
        initiate: (...args: any[]) => mockBinanceInitiate(...args),
      },
      searchBinanceSymbols: {
        initiate: (...args: any[]) => mockBinanceSearchInitiate(...args),
      },
      getBinanceExchangeInfo: {
        initiate: (...args: any[]) => mockBinanceExchangeInfoInitiate(...args),
      },
    },
  },
  // тип нам тут не важен, просто чтобы импорт не падал
  BinanceKlineRaw: {} as any,
}));

describe('fetchBinanceTimeseries', () => {
  beforeEach(() => {
    mockBinanceInitiate.mockReset();
    mockBinanceSearchInitiate.mockReset();
    mockBinanceExchangeInfoInitiate.mockReset();
  });

  it('вызывает getBinanceTimeseries с корректными параметрами и возвращает данные', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    const params = {
      symbol: 'BTCUSDT',
      timeframe: '1h' as const,
      limit: 100,
    };

    const mockData = [[1, 2, 3, 4, 5, 6]] as any;

    const mockQueryResult = {
      unwrap: vi.fn().mockResolvedValue(mockData),
      unsubscribe: vi.fn(),
    };

    // initiate вернёт наш объект c unwrap/unsubscribe
    mockBinanceInitiate.mockReturnValue(mockQueryResult);

    const result = await fetchBinanceTimeseries(mockDispatch as any, params);

    expect(mockBinanceInitiate).toHaveBeenCalledTimes(1);
    expect(mockBinanceInitiate).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      interval: '1h',
      limit: 100,
    });

    // dispatch получает то, что вернул initiate
    expect(mockDispatch).toHaveBeenCalledWith(mockQueryResult);

    expect(mockQueryResult.unwrap).toHaveBeenCalledTimes(1);
    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockData);
  });

  it('маппит timeframe 7d на binance interval 1w', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    const params = {
      symbol: 'BTCUSDT',
      timeframe: '7d' as const,
      limit: 10,
    };

    const mockQueryResult = {
      unwrap: vi.fn().mockResolvedValue([]),
      unsubscribe: vi.fn(),
      abort: vi.fn(),
    };

    mockBinanceInitiate.mockReturnValue(mockQueryResult);

    await fetchBinanceTimeseries(mockDispatch as any, params);

    expect(mockBinanceInitiate).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      interval: '1w',
      limit: 10,
    });
  });

  it('использует таймфрейм как есть для нестандартного значения', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    const params = {
      symbol: 'BTCUSDT',
      timeframe: '2h' as any,
      limit: 5,
    };

    const mockQueryResult = {
      unwrap: vi.fn().mockResolvedValue([]),
      unsubscribe: vi.fn(),
    };

    mockBinanceInitiate.mockReturnValue(mockQueryResult);

    await fetchBinanceTimeseries(mockDispatch as any, params);

    expect(mockBinanceInitiate).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      interval: '2h',
      limit: 5,
    });
  });

  it('абортирует inflight запрос через AbortSignal', async () => {
    const mockDispatch = vi.fn((action: any) => action);
    const controller = new AbortController();

    const params = {
      symbol: 'BTCUSDT',
      timeframe: '1h' as const,
      limit: 5,
    };

    const mockQueryResult = {
      unwrap: vi.fn().mockResolvedValue([]),
      unsubscribe: vi.fn(),
      abort: vi.fn(),
    };

    mockBinanceInitiate.mockReturnValue(mockQueryResult);

    const promise = fetchBinanceTimeseries(mockDispatch as any, params, {
      signal: controller.signal,
    });

    controller.abort();
    await promise;

    expect(mockQueryResult.abort).toHaveBeenCalledTimes(1);
    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('формирует понятное сообщение при rate limit (429)', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    const params = {
      symbol: 'BTCUSDT',
      timeframe: '1h' as const,
      limit: 5,
    };

    const mockQueryResult = {
      unwrap: vi.fn().mockRejectedValue({
        status: 429,
        data: { message: 'Too Many Requests' },
      }),
      unsubscribe: vi.fn(),
    };

    mockBinanceInitiate.mockReturnValue(mockQueryResult);

    await expect(
      fetchBinanceTimeseries(mockDispatch as any, params),
    ).rejects.toThrow('Rate limit exceeded (status 429)');

    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('searchBinanceSymbols сразу отказывает при abort', async () => {
    const mockDispatch = vi.fn();
    const controller = new AbortController();
    controller.abort();

    await expect(
      searchBinanceSymbols(mockDispatch as any, 'btc', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(mockBinanceSearchInitiate).not.toHaveBeenCalled();
  });

  it('searchBinanceSymbols возвращает пустой массив для пустого запроса', async () => {
    const mockDispatch = vi.fn();

    const result = await searchBinanceSymbols(mockDispatch as any, '   ');

    expect(result).toEqual([]);
    expect(mockBinanceSearchInitiate).not.toHaveBeenCalled();
  });

  it('searchBinanceSymbols возвращает пустой массив при ошибке', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    const mockQueryResult = {
      unwrap: vi.fn().mockRejectedValue(new Error('fail')),
      unsubscribe: vi.fn(),
      abort: vi.fn(),
    };

    mockBinanceSearchInitiate.mockReturnValue(mockQueryResult);

    const result = await searchBinanceSymbols(mockDispatch as any, 'btc');

    expect(result).toEqual([]);
    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('fetchBinanceExchangeInfo', () => {
  beforeEach(() => {
    mockBinanceExchangeInfoInitiate.mockReset();
  });

  it('возвращает данные обменника', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    const mockQueryResult = {
      unwrap: vi.fn().mockResolvedValue({ symbols: [{ symbol: 'BTCUSDT' }] }),
      unsubscribe: vi.fn(),
    };

    mockBinanceExchangeInfoInitiate.mockReturnValue(mockQueryResult);

    const result = await fetchBinanceExchangeInfo(mockDispatch as any);

    expect(result).toEqual({ symbols: [{ symbol: 'BTCUSDT' }] });
    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('возвращает пустые symbols при ошибке', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    const mockQueryResult = {
      unwrap: vi.fn().mockRejectedValue(new Error('boom')),
      unsubscribe: vi.fn(),
      abort: vi.fn(),
    };

    mockBinanceExchangeInfoInitiate.mockReturnValue(mockQueryResult);

    const result = await fetchBinanceExchangeInfo(mockDispatch as any);

    expect(result).toEqual({ symbols: [] });
    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('отказывает при abort до запроса', async () => {
    const mockDispatch = vi.fn();
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchBinanceExchangeInfo(mockDispatch as any, {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(mockBinanceExchangeInfoInitiate).not.toHaveBeenCalled();
  });
});
