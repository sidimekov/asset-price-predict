// apps/web/src/__tests__/features/market-adapter/cache/ClientTimeseriesCache.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ClientTimeseriesCache,
  clientTimeseriesCache,
  makeTimeseriesCacheKey,
  type Bar,
} from '@/features/market-adapter/cache/ClientTimeseriesCache';

describe('ClientTimeseriesCache', () => {
  const NOW = new Date('2024-01-01T00:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('возвращает null для отсутствующего ключа', () => {
    const cache = new ClientTimeseriesCache<string[]>(10_000);

    expect(cache.get('unknown')).toBeNull();
  });

  it('сохраняет и возвращает значение до истечения TTL', () => {
    const cache = new ClientTimeseriesCache<string[]>(1_000);
    const key = 'test:key';
    const data = ['foo'];

    cache.set(key, data);

    // прошло меньше ttl
    vi.advanceTimersByTime(500);

    expect(cache.get(key)).toEqual(data);
  });

  it('удаляет и не возвращает значение после истечения TTL', () => {
    const cache = new ClientTimeseriesCache<string[]>(1_000);
    const key = 'test:key';
    const data = ['foo'];

    cache.set(key, data);

    // прошло больше ttl
    vi.advanceTimersByTime(1500);

    // первый get вернёт null и удалит запись
    expect(cache.get(key)).toBeNull();
    // и второй тоже уже вернёт null
    expect(cache.get(key)).toBeNull();
  });

  it('clear очищает все значения', () => {
    const cache = new ClientTimeseriesCache<string[]>(10_000);
    const key = 'test:key';
    const data = ['foo'];

    cache.set(key, data);
    cache.clear();

    expect(cache.get(key)).toBeNull();
  });

  it('singleton clientTimeseriesCache работает как обычный кэш', () => {
    const key = makeTimeseriesCacheKey('binance', 'BTCUSDT', '1d', 100);
    const bars: Bar[] = [[1, 2, 3, 4, 5, 6]];

    clientTimeseriesCache.clear();
    clientTimeseriesCache.set(key, bars);

    expect(clientTimeseriesCache.get(key)).toEqual(bars);
  });
});

describe('makeTimeseriesCacheKey', () => {
  it('формирует корректный ключ по параметрам', () => {
    const key = makeTimeseriesCacheKey('binance', 'BTCUSDT', '1d', 100);
    expect(key).toBe('market:binance:BTCUSDT:1d:100');
  });
});
