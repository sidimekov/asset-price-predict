// apps/web/src/__tests__/features/market-adapter/providers/MockProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMockTimeseries,
  searchMockSymbols,
} from '@/features/market-adapter/providers/MockProvider';

const dispatch = vi.fn() as any;

describe('MockProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchMockTimeseries генерирует данные локально (без marketApi)', async () => {
    const result = (await fetchMockTimeseries(dispatch, {
      symbol: 'TEST',
      timeframe: '1h',
      limit: 5,
    })) as any[];

    // локальный мок не должен требовать dispatch и не должен трогать сеть
    expect(dispatch).not.toHaveBeenCalled();

    expect(Array.isArray(result)).toBe(true);
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

    // timestamps должны быть возрастающими и "похожими на ms"
    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][0]);
      expect(result[i][0]).toBeGreaterThan(1_000_000_000_000);
    }
  });

  it('генерация детерминированная (одинаковый symbol+timeframe+limit -> одинаковый результат)', async () => {
    const params = { symbol: 'BTCUSDT', timeframe: '1h', limit: 10 };

    const a = await fetchMockTimeseries(dispatch, params);
    const b = await fetchMockTimeseries(dispatch, params);

    expect(a).toEqual(b);
  });

  it('timeframe влияет на шаг времени', async () => {
    const a = (await fetchMockTimeseries(dispatch, {
      symbol: 'X',
      timeframe: '1h',
      limit: 3,
    })) as any[];

    const b = (await fetchMockTimeseries(dispatch, {
      symbol: 'X',
      timeframe: '1d',
      limit: 3,
    })) as any[];

    const stepA = a[1][0] - a[0][0];
    const stepB = b[1][0] - b[0][0];

    expect(stepB).toBeGreaterThan(stepA);
  });

  it('fetchMockTimeseries сразу отказывает при abort', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchMockTimeseries(
        dispatch,
        {
          symbol: 'TEST',
          timeframe: '1h',
          limit: 5,
        },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('searchMockSymbols сразу отказывает при abort', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      searchMockSymbols('btc', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
