'use client';

import { useState } from 'react';
import SearchBar from '@/features/history/HistorySearch';
import HistoryTable from '@/features/history/HistoryTable';

export default function HistoryPage() {
  const [loading] = useState(false);

  const handleSearch = (query: string) => {
    console.log('Поиск по:', query);
  };

  return (
    <main className="history-page">
      <div className="search-bar-wrapper">
        <SearchBar searchAction={handleSearch} />
      </div>

      <div className="history-page-content">
        {/* items не передаём — HistoryTable сам возьмёт моковые данные */}
        <HistoryTable loading={loading} />
      </div>
    </main>
  );
}
