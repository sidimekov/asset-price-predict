'use client';

import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  
}