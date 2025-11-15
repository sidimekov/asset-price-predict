// apps/web/src/__tests__/features/market-adapter/providers/BinanceProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockBinanceInitiate = vi.fn();

vi.mock('@/shared/api/marketApi', () => ({
  marketApi: {
    endpoints: {
      getBinanceTimeseries: { initiate: mockBinanceInitiate },
    },
  },
  BinanceKline: {} as any,
}));

import { fetchBinanceTimeseries } from '@/features/market-adapter/providers/BinanceProvider';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchBinanceTimeseries', () => {
  it('вызывает RTK Query эндпоинт с корректными параметрами и возвращает данные', async () => {
    const dispatch = vi.fn();

    const unwrap = vi.fn().mockResolvedValue(['kline-1'] as any);
    const unsubscribe = vi.fn();

    mockBinanceInitiate.mockReturnValueOnce({ unwrap, unsubscribe });

    const result = await fetchBinanceTimeseries(dispatch as any, {
      symbol: 'BTCUSDT',
      timeframe: '1h',
      limit: 10,
    });

    // эндпоинт дергается с нужными аргументами
    expect(mockBinanceInitiate).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      interval: '1h',
      limit: 10,
    });

    // dispatch получает то, что вернул initiate
    expect(dispatch).toHaveBeenCalledWith({ unwrap, unsubscribe });

    // unwrap и unsubscribe были вызваны
    expect(unwrap).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    // а наружу возвращается распакованный результат
    expect(result).toEqual(['kline-1']);
  });
});
