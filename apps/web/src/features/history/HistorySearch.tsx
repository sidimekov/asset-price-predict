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

  const popoverRef = useRef<any>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
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
    <div className="search-bar-container">
      <button className="search-button" aria-hidden>
        <img src="/magnifier.svg" alt="" />
      </button>

      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          onSearch(value);
        }}
        className="search-input"
      />

      <div style={{ position: 'relative' }}>
        <button
          className="filter-button"
          onClick={handleFilter}
          aria-label="Фильтры"
        >
          <img src="/filter.svg" alt="Фильтр" />
        </button>

        {filterClicked && (
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Filters"
            className="search-filter-popover"
          >
            <div className="search-filter-arrow" />
            <div className="filter-popover-content">
              <div className="filter-section">
                <div className="filter-section-title">Category</div>
                <div className="filter-categories">
                  {['1', '2', '3'].map((num) => (
                    <label key={num} className="filter-label">
                      <input
                        type="checkbox"
                        checked={
                          filters.categories[
                            `c${num}` as keyof typeof filters.categories
                          ]
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFilters((f) => ({
                            ...f,
                            categories: {
                              ...f.categories,
                              [`c${num}`]: checked,
                            },
                          }));
                        }}
                        className="filter-checkbox"
                      />
                      <span>Category {num}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">Data</div>
                <div className="filter-options">
                  <label className="filter-label">
                    <input
                      type="radio"
                      name="order"
                      value="desc"
                      checked={filters.order === 'desc'}
                      onChange={() =>
                        setFilters((f) => ({ ...f, order: 'desc' }))
                      }
                      className="filter-checkbox"
                    />
                    <span>Descending order</span>
                  </label>
                  <label className="filter-label">
                    <input
                      type="radio"
                      name="order"
                      value="asc"
                      checked={filters.order === 'asc'}
                      onChange={() =>
                        setFilters((f) => ({ ...f, order: 'asc' }))
                      }
                      className="filter-checkbox"
                    />
                    <span>Ascending order</span>
                  </label>
                </div>
              </div>

              <button onClick={applyFilters} className="apply-filter-button">
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
