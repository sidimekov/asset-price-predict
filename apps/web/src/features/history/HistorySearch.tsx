import { useState, useRef, useEffect, useMemo } from 'react';

type ProviderKey = 'binance' | 'moex' | 'mock';
type AssetClassKey = 'equity' | 'fx' | 'crypto' | 'etf' | 'bond' | 'other';

export type HistoryFilters = {
  providers: Record<ProviderKey, boolean>;
  assetClasses: Record<AssetClassKey, boolean>;
  currencies: Record<string, boolean>;
  order: 'desc' | 'asc';
};

type Props = {
  // коллбек поиска
  searchAction: (q: string) => void;
  // коллбек применения фильтров
  applyFiltersAction?: (v: HistoryFilters) => void;
  currencyOptions?: string[];
};

export default function HistorySearch({
  searchAction,
  applyFiltersAction,
  currencyOptions,
}: Props) {
  const [query, setQuery] = useState('');
  const [filterClicked, setFilterClicked] = useState(false);
  const normalizedCurrencyOptions = useMemo(
    () => currencyOptions ?? [],
    [currencyOptions],
  );
  const [filters, setFilters] = useState<HistoryFilters>(() => ({
    providers: { binance: false, moex: false, mock: false },
    assetClasses: {
      equity: false,
      fx: false,
      crypto: false,
      etf: false,
      bond: false,
      other: false,
    },
    currencies: Object.fromEntries(
      normalizedCurrencyOptions.map((c) => [c, false]),
    ),
    order: 'desc',
  }));

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

  useEffect(() => {
    setFilters((prev) => {
      const nextCurrencies: Record<string, boolean> = { ...prev.currencies };
      normalizedCurrencyOptions.forEach((currency) => {
        if (!(currency in nextCurrencies)) {
          nextCurrencies[currency] = false;
        }
      });
      Object.keys(nextCurrencies).forEach((currency) => {
        if (!normalizedCurrencyOptions.includes(currency)) {
          delete nextCurrencies[currency];
        }
      });
      return { ...prev, currencies: nextCurrencies };
    });
  }, [normalizedCurrencyOptions]);

  const handleFilter = () => setFilterClicked((v) => !v);

  const applyFilters = () => {
    applyFiltersAction?.(filters);
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
          searchAction(value);
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
                <div className="filter-section-title">Exchange</div>
                <div className="filter-categories">
                  {(['binance', 'moex', 'mock'] as const).map((provider) => (
                    <label key={provider} className="filter-label">
                      <input
                        type="checkbox"
                        checked={filters.providers[provider]}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFilters((f) => ({
                            ...f,
                            providers: {
                              ...f.providers,
                              [provider]: checked,
                            },
                          }));
                        }}
                        className="filter-checkbox"
                      />
                      <span>{provider.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">Asset Class</div>
                <div className="filter-categories">
                  {(
                    ['equity', 'fx', 'crypto', 'etf', 'bond', 'other'] as const
                  ).map((assetClass) => (
                    <label key={assetClass} className="filter-label">
                      <input
                        type="checkbox"
                        checked={filters.assetClasses[assetClass]}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFilters((f) => ({
                            ...f,
                            assetClasses: {
                              ...f.assetClasses,
                              [assetClass]: checked,
                            },
                          }));
                        }}
                        className="filter-checkbox"
                      />
                      <span>{assetClass.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">Currency</div>
                <div className="filter-categories">
                  {normalizedCurrencyOptions.length === 0 ? (
                    <span className="filter-label">No currencies</span>
                  ) : (
                    normalizedCurrencyOptions.map((currency) => (
                      <label key={currency} className="filter-label">
                        <input
                          type="checkbox"
                          checked={filters.currencies[currency] || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFilters((f) => ({
                              ...f,
                              currencies: {
                                ...f.currencies,
                                [currency]: checked,
                              },
                            }));
                          }}
                          className="filter-checkbox"
                        />
                        <span>{currency}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">Date</div>
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
