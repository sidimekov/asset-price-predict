'use client';

import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  return (
    <div className="flex gap-2 mb-4">
      <button className="px-4">лупа</button>
      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 rounded-[90px]"
      />
      <button className="px-4">фильтр</button>

    </div>
  );
}