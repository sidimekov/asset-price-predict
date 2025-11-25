// apps/web/src/__tests__/features/market-adapter/providers/MoexProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMoexTimeseries } from '@/features/market-adapter/providers/MoexProvider';

// hoisted-мок для initiate
const { mockMoexInitiate } = vi.hoisted(() => ({
  mockMoexInitiate: vi.fn(),
}));

vi.mock('@/shared/api/marketApi', () => ({
  __esModule: true,
  marketApi: {
    endpoints: {
      getMoexTimeseries: {
        initiate: (...args: any[]) => mockMoexInitiate(...args),
      },
    },
  },
}));

describe('fetchMoexTimeseries', () => {
  beforeEach(() => {
    mockMoexInitiate.mockReset();
  });

  it('вызывает getMoexTimeseries и возвращает данные', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    const params = {
      symbol: 'SBER',
      timeframe: '1d' as const,
      limit: 20,
    };

    const mockData = [{ price: 100 }] as any;

    const mockQueryResult = {
      unwrap: vi.fn().mockResolvedValue(mockData),
      unsubscribe: vi.fn(),
    };

    mockMoexInitiate.mockReturnValue(mockQueryResult);

    const result = await fetchMoexTimeseries(
      mockDispatch as any,
      params as any,
    );

    expect(mockMoexInitiate).toHaveBeenCalledTimes(1);
    expect(mockMoexInitiate).toHaveBeenCalledWith({
      symbol: 'SBER',
      timeframe: '1d',
      limit: 20,
    });

    expect(mockDispatch).toHaveBeenCalledWith(mockQueryResult);

    expect(mockQueryResult.unwrap).toHaveBeenCalledTimes(1);
    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockData);
  });
});
