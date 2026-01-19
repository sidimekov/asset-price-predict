import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { HistoryEntry } from '@/entities/history/model';
import {
  localHistorySource,
  isHistoryEntry,
} from '@/entities/history/sources/local';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const makeEntry = (id = 'id-1'): HistoryEntry => ({
  id,
  created_at: '2025-01-02T10:00:00.000Z',
  symbol: 'BTC',
  tf: '1h',
  horizon: 3,
  provider: 'MOEX',
  p50: [
    [1, 100],
    [2, 101],
  ],
  p10: [
    [1, 98],
    [2, 99],
  ],
  p90: [
    [1, 102],
    [2, 103],
  ],
  meta: { runtime_ms: 5, backend: 'client', model_ver: 'v1' },
});

describe('localHistorySource', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('returns empty list when storage is empty', async () => {
    const list = await localHistorySource.list();
    expect(list).toEqual([]);
    const item = await localHistorySource.getById('missing');
    expect(item).toBeNull();
  });

  it('saves, loads, and clears entries', async () => {
    const entry = makeEntry();

    await localHistorySource.save(entry);
    const list = await localHistorySource.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(entry.id);

    const found = await localHistorySource.getById(entry.id);
    expect(found?.id).toBe(entry.id);

    await localHistorySource.clear();
    const afterClear = await localHistorySource.list();
    expect(afterClear).toEqual([]);
  });

  it('filters out invalid entries and keeps valid HistoryEntry shape', async () => {
    const valid = makeEntry('id-valid');
    const invalid = { foo: 'bar' };
    localStorageMock.setItem(
      'localForecasts',
      JSON.stringify([valid, invalid]),
    );

    const list = await localHistorySource.list();
    expect(list).toHaveLength(1);
    expect(isHistoryEntry(list[0])).toBe(true);
    expect(list[0].id).toBe(valid.id);
  });

  it('returns paginated entries sorted by created_at', async () => {
    const createEntry = (index: number): HistoryEntry => ({
      id: `entry-${index}`,
      created_at: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
      symbol: 'BTC',
      tf: '1h',
      horizon: 3,
      provider: 'MOEX',
      p50: [[1, 100]],
      meta: { runtime_ms: 5, backend: 'client', model_ver: 'v1' },
    });

    for (let i = 0; i < 25; i += 1) {
      await localHistorySource.save(createEntry(i));
    }

    const firstPage = await localHistorySource.listPage({
      page: 1,
      limit: 10,
    });
    expect(firstPage.total).toBe(25);
    expect(firstPage.items).toHaveLength(10);
    expect(firstPage.items[0].created_at).toBe(createEntry(24).created_at);

    const secondPage = await localHistorySource.listPage({
      page: 2,
      limit: 10,
    });
    expect(secondPage.items).toHaveLength(10);
    expect(secondPage.page).toBe(2);
    expect(secondPage.items[0].created_at).toBe(createEntry(14).created_at);
  });
});
