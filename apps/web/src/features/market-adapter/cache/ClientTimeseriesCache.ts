// apps/web/src/features/market-adapter/cache/ClientTimeseriesCache.ts
import { CACHE_TTL_MS } from '@/config/market';

export type Bar = [number, number, number, number, number, number?];
// [ts, open, high, low, close, volume?]

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

export class ClientTimeseriesCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number = CACHE_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.cachedAt > this.ttlMs;
    if (isExpired) {
      this.store.delete(key);
      return null;
    }

    console.info(`[MarketAdapter][Cache] HIT for key=${key}`);
    return entry.data;
  }

  set(key: string, data: T) {
    this.store.set(key, { data, cachedAt: Date.now() });
    console.info(`[MarketAdapter][Cache] SET key=${key}`);
  }

  clear() {
    this.store.clear();
    console.info('[MarketAdapter][Cache] CLEAR ALL');
  }
}

export const clientTimeseriesCache = new ClientTimeseriesCache<Bar[]>();

export const makeTimeseriesCacheKey = (
  provider: string,
  symbol: string,
  timeframe: string,
  limit: number,
) => `market:${provider}:${symbol}:${timeframe}:${limit}`;
