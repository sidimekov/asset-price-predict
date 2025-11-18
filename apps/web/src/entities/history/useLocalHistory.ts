// apps/web/src/entities/history/useLocalHistory.ts
import { useEffect, useState } from 'react';
import { LocalHistory } from './localHistory';
import type { LocalHistoryList } from './model';

export const useLocalHistory = () => {
  const [items, setItems] = useState<LocalHistoryList>([]);

  useEffect(() => {
    const loaded = LocalHistory.load();
    setItems(loaded);
  }, []);

  return { items };
};
