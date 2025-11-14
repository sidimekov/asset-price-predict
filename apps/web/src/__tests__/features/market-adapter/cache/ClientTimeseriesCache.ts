// apps/web/src/__tests__/features/market-adapter/ClientTimeseriesCache.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clientTimeseriesCache,
  type Bar,
} from '@/features/market-adapter/cache/ClientTimeseriesCache';
import { CACHE_TTL_MS } from '@/config/market';

describe('ClientTimeseriesCache', () => {
  beforeEach(() => {
    clientTimeseriesCache.clear();
    vi.useRealTimers();
  });

  it('stores and returns value when not expired', () => {
    const key = 'market:MOCK:BTCUSDT:1h:100';
    const data: Bar[] = [[1, 2, 3, 1, 2, 10]];

    clientTimeseriesCache.set(key, data);
    const res = clientTimeseriesCache.get(key);

    expect(res).not.toBeNull();
    expect(res).toEqual(data);
  });

  it('returns null when expired', () => {
    vi.useFakeTimers();

    const key = 'market:MOCK:BTCUSDT:1h:50';
    const data: Bar[] = [[1, 2, 3, 1, 2, 10]];

    clientTimeseriesCache.set(key, data);

    // «перематываем» время дальше TTL
    vi.setSystemTime(Date.now() + CACHE_TTL_MS + 1);

    const res = clientTimeseriesCache.get(key);

    expect(res).toBeNull();

    vi.useRealTimers();
  });
});
