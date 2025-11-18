'use client';

import { useMemo, useState } from 'react';
import SearchBar from '@/features/history/HistorySearch';
import HistoryTable from '@/features/history/HistoryTable';
import { useLocalHistory } from '@/entities/history/useLocalHistory';
import type { LocalHistoryEntry } from '@/entities/history/model';

function mapEntryToRow(entry: LocalHistoryEntry) {
  return {
    asset: entry.symbol,
    date: new Date(entry.created_at).toLocaleString(),
    model: entry.meta.backend || entry.provider,
    input: `${entry.tf}, horizon=${entry.horizon}`,
    period: `${entry.horizon} bars`,
    factors_top5: entry.explain.slice(0, 5).map((f) => f.name),
  };
}

export default function HistoryPage() {
  const { items } = useLocalHistory();
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => items.map(mapEntryToRow), [items]);

  const handleSearch = (query: string) => {
    console.log('Поиск по:', query);
    // позже можешь добавить фильтрацию rows по query
  };

  return (
    <main className="history-page">
      <div className="search-bar-wrapper">
        <SearchBar onSearch={handleSearch} />
      </div>
      <div className="history-page-content">
        <HistoryTable loading={loading} items={rows} />
      </div>
    </main>
  );
}
