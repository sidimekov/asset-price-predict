'use client';
import "../../app/globals.css"
import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  return (
    <div className="flex gap-2 mb-4">
      <button className="px-4 bg-none ">
        <img src="/magnifier.svg" alt="Поиск" className="w-5 h-5 "/>
      </button>
      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-[#302E53] border-none border p-2 rounded-[90px]"
      />
      <button className="px-4">
        <img src="/filter.svg" alt="Поиск" className="w-5 h-5 "/>
        </button>

    </div>
  );
}