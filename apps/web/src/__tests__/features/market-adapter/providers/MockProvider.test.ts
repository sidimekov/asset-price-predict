// apps/web/src/__tests__/features/market-adapter/providers/MockProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMockInitiate = vi.fn();

vi.mock('@/shared/api/marketApi', () => ({
  marketApi: {
    endpoints: {
      getMockTimeseries: { initiate: mockMockInitiate },
    },
  },
}));

import {
  fetchMockTimeseries,
  generateMockBarsRaw,
} from '@/features/market-adapter/providers/MockProvider';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchMockTimeseries', () => {
  it('вызывает моковый эндпоинт и возвращает данные', async () => {
    const dispatch = vi.fn();

    const unwrap = vi.fn().mockResolvedValue([{ foo: 'bar' }]);
    const unsubscribe = vi.fn();

    mockMockInitiate.mockReturnValueOnce({ unwrap, unsubscribe });

    const result = await fetchMockTimeseries(dispatch as any, {
      symbol: 'MOCK',
      timeframe: '4h',
      limit: 5,
    });

    expect(mockMockInitiate).toHaveBeenCalledWith({
      symbol: 'MOCK',
      timeframe: '4h',
      limit: 5,
    });

    expect(dispatch).toHaveBeenCalledWith({ unwrap, unsubscribe });
    expect(unwrap).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    expect(result).toEqual([{ foo: 'bar' }]);
  });
});

describe('generateMockBarsRaw', () => {
  it('генерирует массив указанной длины и формы [ts, o, h, l, c, v]', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const randSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const res = generateMockBarsRaw({
      symbol: 'MOCK',
      timeframe: '1h',
      limit: 3,
    });

    expect(res).toHaveLength(3);

    for (const row of res) {
      expect(row).toHaveLength(6);
      for (const val of row) {
        expect(typeof val).toBe('number');
      }
    }

    nowSpy.mockRestore();
    randSpy.mockRestore();
  });
});
