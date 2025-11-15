// apps/web/src/__tests__/features/market-adapter/providers/MoexProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMoexInitiate = vi.fn();

vi.mock('@/shared/api/marketApi', () => ({
  marketApi: {
    endpoints: {
      getMoexTimeseries: { initiate: mockMoexInitiate },
    },
  },
}));

import { fetchMoexTimeseries } from '@/features/market-adapter/providers/MoexProvider';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchMoexTimeseries', () => {
  it('вызывает Moex эндпоинт и возвращает данные', async () => {
    const dispatch = vi.fn();

    const unwrap = vi.fn().mockResolvedValue([{ bar: 1 }]);
    const unsubscribe = vi.fn();

    mockMoexInitiate.mockReturnValueOnce({ unwrap, unsubscribe });

    const result = await fetchMoexTimeseries(dispatch as any, {
      symbol: 'SBER',
      timeframe: '1d',
      limit: 20,
    });

    expect(mockMoexInitiate).toHaveBeenCalledWith({
      symbol: 'SBER',
      timeframe: '1d',
      limit: 20,
    });

    expect(dispatch).toHaveBeenCalledWith({ unwrap, unsubscribe });
    expect(unwrap).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    expect(result).toEqual([{ bar: 1 }]);
  });
});
