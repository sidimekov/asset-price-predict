// apps/web/src/__tests__/features/market-adapter/providers/BinanceProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchBinanceTimeseries,
  searchBinanceSymbols,
} from '@/features/market-adapter/providers/BinanceProvider';

// хостим мок до vi.mock
const { mockBinanceInitiate, mockBinanceSearchInitiate } = vi.hoisted(() => ({
  mockBinanceInitiate: vi.fn(),
  mockBinanceSearchInitiate: vi.fn(),
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
    },
  },
  // тип нам тут не важен, просто чтобы импорт не падал
  BinanceKlineRaw: {} as any,
}));

describe('fetchBinanceTimeseries', () => {
  beforeEach(() => {
    mockBinanceInitiate.mockReset();
    mockBinanceSearchInitiate.mockReset();
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
});
