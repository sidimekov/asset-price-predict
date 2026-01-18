import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HistoryEntry } from '@/entities/history/model';
import { hybridHistorySource } from '@/entities/history/sources/hybrid';
import { backendHistorySource } from '@/entities/history/sources/backend';
import { localHistorySource } from '@/entities/history/sources/local';

vi.mock('@/entities/history/sources/backend', () => ({
  backendHistorySource: {
    listPage: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('@/entities/history/sources/local', () => ({
  localHistorySource: {
    listPage: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

const backendMock = vi.mocked(backendHistorySource);
const localMock = vi.mocked(localHistorySource);

describe('hybridHistorySource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns backend results when backend listPage succeeds', async () => {
    const page = { items: [], total: 0, page: 1, limit: 10 };
    backendMock.listPage.mockResolvedValue(page);

    const result = await hybridHistorySource.listPage({ page: 1, limit: 10 });

    expect(backendMock.listPage).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(localMock.listPage).not.toHaveBeenCalled();
    expect(result).toEqual(page);
  });

  it('falls back to local listPage on backend failure', async () => {
    backendMock.listPage.mockRejectedValue(new Error('boom'));
    const fallback = { items: [], total: 0, page: 1, limit: 10 };
    localMock.listPage.mockResolvedValue(fallback);

    const result = await hybridHistorySource.listPage({ page: 2, limit: 5 });

    expect(backendMock.listPage).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(localMock.listPage).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(result).toEqual(fallback);
  });

  it('delegates save to local source', async () => {
    const entry: HistoryEntry = {
      id: 'id',
      created_at: new Date().toISOString(),
      symbol: 'BTC',
      tf: '1h',
      horizon: 1,
      provider: 'MOCK',
      p50: [[1, 1]],
      meta: { runtime_ms: 1, backend: 'client' },
    };
    await hybridHistorySource.save(entry);
    expect(localMock.save).toHaveBeenCalledWith(entry);
  });
});
