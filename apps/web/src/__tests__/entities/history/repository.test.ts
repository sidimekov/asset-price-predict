import { afterEach, describe, it, expect, vi } from 'vitest';
import type { HistoryEntry } from '@/entities/history/model';

const createMockSource = () => ({
  list: vi.fn<() => Promise<HistoryEntry[]>>(() => Promise.resolve([])),
  listPage: vi.fn(() =>
    Promise.resolve({ items: [], total: 0, page: 1, limit: 20 }),
  ),
  getById: vi.fn<() => Promise<HistoryEntry | null>>(() =>
    Promise.resolve(null),
  ),
  save: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
});

const loadRepository = async (env: Record<string, string | undefined>) => {
  vi.resetModules();
  const previousEnv = { ...process.env };
  Object.entries(env).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });

  const localSource = createMockSource();
  const hybridSource = createMockSource();

  vi.doMock('@/entities/history/sources/local', () => ({
    localHistorySource: localSource,
  }));
  vi.doMock('@/entities/history/sources/hybrid', () => ({
    hybridHistorySource: hybridSource,
  }));

  const { historyRepository } = await import('@/entities/history/repository');

  return {
    repository: historyRepository,
    localSource,
    hybridSource,
    restoreEnv: () => {
      process.env = previousEnv;
    },
  };
};

describe('historyRepository', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('uses hybrid source by default', async () => {
    const { repository, localSource, hybridSource, restoreEnv } =
      await loadRepository({
        NEXT_PUBLIC_HISTORY_SOURCE: undefined,
        HISTORY_SOURCE: undefined,
      });

    try {
      await repository.list();
      expect(hybridSource.list).toHaveBeenCalled();
      expect(localSource.list).not.toHaveBeenCalled();
    } finally {
      restoreEnv();
    }
  });

  it('uses local source when forced via env', async () => {
    const { repository, localSource, hybridSource, restoreEnv } =
      await loadRepository({
        NEXT_PUBLIC_HISTORY_SOURCE: 'local',
        HISTORY_SOURCE: undefined,
      });

    try {
      await repository.list();
      expect(localSource.list).toHaveBeenCalled();
      expect(hybridSource.list).not.toHaveBeenCalled();
    } finally {
      restoreEnv();
    }
  });

  it('treats backend env as hybrid', async () => {
    const { repository, localSource, hybridSource, restoreEnv } =
      await loadRepository({
        NEXT_PUBLIC_HISTORY_SOURCE: 'backend',
        HISTORY_SOURCE: undefined,
      });

    try {
      await repository.listPage({ page: 2, limit: 5 });
      expect(hybridSource.listPage).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
      });
      expect(localSource.listPage).not.toHaveBeenCalled();
    } finally {
      restoreEnv();
    }
  });
});
