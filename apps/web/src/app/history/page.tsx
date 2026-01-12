'use client';

import { useMemo, useState } from 'react';
import SearchBar from '@/features/history/HistorySearch';
import HistoryTable from '@/features/history/HistoryTable';
import { useHistory } from '@/entities/history/useHistory';

export default function HistoryPage() {
  const [query, setQuery] = useState('');
  const { items, loading, error } = useHistory();

  const handleSearch = (query: string) => {
    setQuery(query);
  };

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <main className="history-page">
      <div className="search-bar-wrapper">
        <SearchBar searchAction={handleSearch} />
      </div>

      <div className="history-page-content">
        {error ? <div className="no-history">{error}</div> : null}
        <HistoryTable loading={loading} items={filteredItems} />
      </div>
    </main>
  );
}
