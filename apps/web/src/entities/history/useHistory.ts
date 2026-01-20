'use client';

import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry } from './model';
import { historyRepository } from './repository';

type UseHistoryOptions = {
  initialPage?: number;
  initialLimit?: number;
};

const clampPage = (value: number) => Math.max(1, Math.floor(value));
const clampLimit = (value: number) => Math.max(1, Math.floor(value));

export function useHistory(options?: UseHistoryOptions) {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(clampPage(options?.initialPage ?? 1));
  const [limit, setLimitState] = useState(
    clampLimit(options?.initialLimit ?? 20),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await historyRepository.listPage({ page, limit });
      setItems(result.items);
      setTotal(result.total);
      setError(null);
      setPageState(result.page);
      setLimitState(result.limit);
    } catch (err: any) {
      setError(err?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setPage = useCallback((value: number) => {
    setPageState((prev) => {
      const next = clampPage(value);
      return prev === next ? prev : next;
    });
  }, []);

  const setLimit = useCallback((value: number) => {
    setLimitState((prev) => {
      const next = clampLimit(value);
      return prev === next ? prev : next;
    });
  }, []);

  return {
    items,
    total,
    page,
    limit,
    loading,
    error,
    setPage,
    setLimit,
    refresh,
  };
}
