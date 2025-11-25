// apps/web/src/__tests__/features/market-adapter/providers/BinanceProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBinanceTimeseries } from '@/features/market-adapter/providers/BinanceProvider';

// хостим мок до vi.mock
const { mockBinanceInitiate } = vi.hoisted(() => ({
  mockBinanceInitiate: vi.fn(),
}));

vi.mock('@/shared/api/marketApi', () => ({
  __esModule: true,
  marketApi: {
    endpoints: {
      getBinanceTimeseries: {
        initiate: (...args: any[]) => mockBinanceInitiate(...args),
      },
    },
  },
  // тип нам тут не важен, просто чтобы импорт не падал
  BinanceKline: {} as any,
}));

describe('fetchBinanceTimeseries', () => {
  beforeEach(() => {
    mockBinanceInitiate.mockReset();
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
});
