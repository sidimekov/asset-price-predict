'use client';

import { useState, useRef, useEffect } from 'react';

type Filters = {
  categories: { c1: boolean; c2: boolean; c3: boolean };
  order: 'desc' | 'asc';
};
type Props = {
  onSearch: (q: string) => void;
  onApplyFilters?: (v: Filters) => void;
};

export default function SearchBar({ onSearch, onApplyFilters }: Props) {
  const [query, setQuery] = useState('');
  const [filterClicked, setFilterClicked] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    categories: { c1: false, c2: false, c3: false },
    order: 'desc',
  });

  const popoverRef = useRef(null);

  // закрытие окна при клике вне — без DOM-типов
  useEffect(() => {
    function handleClickOutside(e: any) {
      const el = popoverRef.current as any;
      if (
        el &&
        typeof el.contains === 'function' &&
        e?.target &&
        !el.contains(e.target)
      ) {
        setFilterClicked(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilter = () => setFilterClicked((v) => !v);

  const applyFilters = () => {
    onApplyFilters?.(filters);
    setFilterClicked(false);
  };

  return (
    <div className="relative flex items-center gap-2 w-full">
      {/* Иконка поиска */}
      <button className="p-2 bg-none" aria-hidden>
        <img src="/magnifier.svg" alt="" className="w-5 h-5" />
      </button>

      {/* Поле ввода — без HTMLInputElement */}
      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => {
          const v = (e.currentTarget as any)['value'];
          setQuery(v);
          onSearch(v);
        }}
        className="bg-[#302E53] text-white border-none p-2 rounded-[90px] w-[220px] outline-none placeholder-white/60 focus:ring-2 focus:ring-white/20"
      />

      {/* Кнопка фильтра */}
      <div className="relative">
        <button className="p-2" onClick={handleFilter}>
          <img src="/filter.svg" alt="Фильтр" className="w-5 h-5" />
        </button>

        {/* Попап фильтра */}
        {filterClicked && (
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Filters"
            className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#2E2B52] border border-white/10 text-white shadow-[0_10px_25px_rgba(0,0,0,0.4)] z-50"
          >
            {/* Треугольничек (стрелочка) */}
            <div className="absolute -top-1.5 right-3 w-3 h-3 rotate-45 bg-[#2E2B52] border-t border-l border-white/10" />

            <div className="p-4 space-y-4">
              {/* Категории */}
              <div>
                <div className="text-[#8480C9] text-sm mb-2">Category</div>
                <div className="grid grid-cols-2 gap-2">
                  {['1', '2', '3'].map((num) => (
                    <label
                      key={num}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(filters.categories as any)[`c${num}`]}
                        onChange={(e) => {
                          const checked = (e.currentTarget as any)['checked'];
                          setFilters((f) => ({
                            ...f,
                            categories: {
                              ...f.categories,
                              [`c${num}`]: checked,
                            } as any,
                          }));
                        }}
                        className="accent-[#8480C9]"
                      />
                      <span className="text-[#8480C9]">Category {num}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Сортировка */}
              <div>
                <div className="text-white/70 text-sm mb-2">Data</div>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="order"
                      value="desc"
                      checked={filters.order === 'desc'}
                      onChange={() =>
                        setFilters((f) => ({ ...f, order: 'desc' }))
                      }
                      className="accent-[#8480C9]"
                    />
                    <span className="text-[#8480C9]">Descending order</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="order"
                      value="asc"
                      checked={filters.order === 'asc'}
                      onChange={() =>
                        setFilters((f) => ({ ...f, order: 'asc' }))
                      }
                      className="accent-[#8480C9]"
                    />
                    <span className="text-[#8480C9]">Ascending order</span>
                  </label>
                </div>
              </div>

              {/* Кнопка Apply */}
              <button
                onClick={applyFilters}
                className="w-full rounded-full bg-[#201D47] hover:bg-[#1B183B] text-white py-2 text-sm transition"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
