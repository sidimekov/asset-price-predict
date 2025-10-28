'use client';
import SearchBar from '@/features/history/HistorySearch';


export default function HistoryPage() {
  const handleSearch = (query: string) => {
    console.log("Поиск по:",query);
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <SearchBar onSearch={handleSearch}/>
    </main>
  );
}