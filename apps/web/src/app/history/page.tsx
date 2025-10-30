'use client';
import { useState } from 'react';
import SearchBar from '@/features/history/HistorySearch';
import HistoryTable from '@/features/history/HistoryTable';

export default function HistoryPage() {
  const [loading, setLoading] = useState(false);
  const handleSearch = (query: string) => {
    console.log("Поиск по:",query);
  }
  return (
    <main className="fixed min-h-screen flex-col p-8 top-2 left-70">
      <SearchBar onSearch={handleSearch}/>
      <HistoryTable loading={loading} />
    </main>
  );
}