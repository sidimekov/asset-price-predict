import { CACHE_TTL_MS } from '@/config/market';
import type { Bar } from '@assetpredict/shared';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

/**
 * Универсальный in-memory кэш с TTL для таймсерий.
 * На клиенте живёт в памяти, на сервере по сути отключён.
 */
export class ClientTimeseriesCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number = CACHE_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    if (!this.store.size) return null;

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

  set(key: string, data: T): void {
    this.store.set(key, { data, cachedAt: Date.now() });
    console.info(`[MarketAdapter][Cache] SET key=${key}`);
  }

  clear(): void {
    this.store.clear();
    console.info('[MarketAdapter][Cache] CLEAR ALL');
  }
}

// Кэш конкретно для баров рынка
export const clientTimeseriesCache = new ClientTimeseriesCache<Bar[]>();

export const makeTimeseriesCacheKey = (
  provider: string,
  symbol: string,
  timeframe: string,
  limit: number,
) => `market:${provider}:${symbol}:${timeframe}:${limit}`;
