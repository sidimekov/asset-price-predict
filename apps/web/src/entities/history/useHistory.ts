'use client';

import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry } from './model';
import { historyRepository } from './repository';

export function useHistory() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await historyRepository.list();
      setItems(list);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
