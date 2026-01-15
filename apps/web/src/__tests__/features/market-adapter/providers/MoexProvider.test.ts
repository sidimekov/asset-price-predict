// apps/web/src/__tests__/features/market-adapter/providers/MoexProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMoexTimeseries,
  searchMoexSymbols,
} from '@/features/market-adapter/providers/MoexProvider';

// hoisted-мок для initiate
const { mockMoexInitiate, mockMoexSearchInitiate } = vi.hoisted(() => ({
  mockMoexInitiate: vi.fn(),
  mockMoexSearchInitiate: vi.fn(),
}));

vi.mock('@/shared/api/marketApi', () => ({
  __esModule: true,
  marketApi: {
    endpoints: {
      getMoexTimeseries: {
        initiate: (...args: any[]) => mockMoexInitiate(...args),
      },
      searchMoexSymbols: {
        initiate: (...args: any[]) => mockMoexSearchInitiate(...args),
      },
    },
  },
}));

describe('fetchMoexTimeseries', () => {
  beforeEach(() => {
    mockMoexInitiate.mockReset();
    mockMoexSearchInitiate.mockReset();
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

  it('абортирует inflight запрос через AbortSignal', async () => {
    const mockDispatch = vi.fn((action: any) => action);
    const controller = new AbortController();

    const params = {
      symbol: 'SBER',
      timeframe: '1d' as const,
      limit: 20,
    };

    const mockQueryResult = {
      unwrap: vi.fn().mockResolvedValue([]),
      unsubscribe: vi.fn(),
      abort: vi.fn(),
    };

    mockMoexInitiate.mockReturnValue(mockQueryResult);

    const promise = fetchMoexTimeseries(mockDispatch as any, params as any, {
      signal: controller.signal,
    });

    controller.abort();
    await promise;

    expect(mockQueryResult.abort).toHaveBeenCalledTimes(1);
    expect(mockQueryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('searchMoexSymbols сразу отказывает при abort', async () => {
    const mockDispatch = vi.fn();
    const controller = new AbortController();
    controller.abort();

    await expect(
      searchMoexSymbols(mockDispatch as any, 'sber', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(mockMoexSearchInitiate).not.toHaveBeenCalled();
  });
});
