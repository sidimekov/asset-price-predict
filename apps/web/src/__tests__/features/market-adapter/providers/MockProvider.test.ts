// apps/web/src/__tests__/features/market-adapter/providers/MockProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMockTimeseries,
  generateMockBarsRaw,
} from '@/features/market-adapter/providers/MockProvider';

// hoisted-мок для initiate
const { mockMockInitiate } = vi.hoisted(() => ({
  mockMockInitiate: vi.fn(),
}));

vi.mock('@/shared/api/marketApi', () => ({
  __esModule: true,
  marketApi: {
    endpoints: {
      getMockTimeseries: {
        initiate: (...args: any[]) => mockMockInitiate(...args),
      },
    },
  },
}));

describe('fetchMockTimeseries', () => {
  beforeEach(() => {
    mockMockInitiate.mockReset();
  });

  it('вызывает getMockTimeseries и возвращает данные', async () => {
    const mockDispatch = vi.fn((action: any) => action);

    // 👇 Параметры, которые реально пойдут в initiate
    const params = {
      symbol: 'TEST',
      timeframe: '1h' as const,
      limit: 10,
    };

    const mockData = [{ foo: 'bar' }] as any;

    const mockQueryResult = {
      unwrap: vi.fn().mockResolvedValue(mockData),
      unsubscribe: vi.fn(),
    };

    mockMockInitiate.mockReturnValue(mockQueryResult);

    const result = await fetchMockTimeseries(
        mockDispatch as any,
        params as any,
    );

    expect(mockMockInitiate).toHaveBeenCalledTimes(1);
    expect(mockMockInitiate).toHaveBeenCalledWith({
      symbol: 'TEST',
      timeframe: '1h',
      limit: 10,
    });

    expect(mockDispatch).toHaveBeenCalledWith(mockQueryResult);

    expect(mockQueryResult.unwrap).toHaveBeenCalledTimes(1);
    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockData);
  });
});

describe('generateMockBarsRaw', () => {
  it('генерирует массив нужной длины и формата [ts, o, h, l, c, v]', () => {
    const params = {
      symbol: 'TEST',
      timeframe: '1h' as const,
      limit: 5,
    };

    const result = generateMockBarsRaw(params as any);

    expect(result).toHaveLength(5);

    for (const bar of result) {
      expect(bar).toHaveLength(6);
      const [ts, o, h, l, c, v] = bar;
      expect(typeof ts).toBe('number');
      expect(typeof o).toBe('number');
      expect(typeof h).toBe('number');
      expect(typeof l).toBe('number');
      expect(typeof c).toBe('number');
      expect(typeof v).toBe('number');
    }
  });
});