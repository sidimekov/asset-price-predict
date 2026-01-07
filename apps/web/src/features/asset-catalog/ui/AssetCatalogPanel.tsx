'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
  setProvider,
  searchStarted,
  searchSucceeded,
  searchFailed,
  selectCatalogResults,
  selectIsSearching,
  selectCatalogError,
  selectCurrentProvider,
  selectRecent,
  setSelected,
  addRecent,
} from '../model/catalogSlice';
import { searchAssets } from '@/features/market-adapter/MarketAdapter';
import type { CatalogItem } from '@shared/types/market';
import debounce from 'lodash.debounce';

const DEBOUNCE_MS = 400;

type CatalogFilters = {
  categories: {
    equities: boolean; // Акции
    indices: boolean; // Индексы (Index CFDs / ETFs)
    fx: boolean; // Валюты
    crypto: boolean; // Криптовалюты
    commodities: boolean; // Сырьё
    bonds: boolean; // Облигации
  };
  order: 'asc' | 'desc';
};

const CATEGORY_LABELS = {
  equities: 'Equities',
  indices: 'Index CFDs / ETFs',
  fx: 'FX',
  crypto: 'Crypto',
  commodities: 'Commodities',
  bonds: 'Bonds',
} as const;

const detectAssetCategory = (
  item: CatalogItem,
): keyof typeof CATEGORY_LABELS => {
  const symbol = item.symbol.toUpperCase();
  const provider = item.provider.toUpperCase();
  const assetClass = item.assetClass?.toLowerCase() || '';

  if (provider === 'MOEX') {
    if (
      item.name?.toLowerCase().includes('облигация') ||
      item.name?.toLowerCase().includes('bond') ||
      assetClass.includes('bond')
    ) {
      return 'bonds';
    }

    if (
      assetClass.includes('stock') ||
      assetClass.includes('акция') ||
      (item.name && !item.name.toLowerCase().includes('индекс'))
    ) {
      return 'equities';
    }

    if (
      assetClass.includes('index') ||
      item.name?.toLowerCase().includes('индекс')
    ) {
      return 'indices';
    }

    return 'equities';
  }

  if (provider === 'BINANCE') {
    if (
      symbol.endsWith('USDT') ||
      symbol.endsWith('BTC') ||
      symbol.endsWith('ETH') ||
      symbol.endsWith('BUSD') ||
      symbol.includes('USD')
    ) {
      return 'crypto';
    }

    if (
      (symbol.includes('USD') && symbol.length === 6) ||
      assetClass.includes('forex') ||
      assetClass.includes('fx')
    ) {
      return 'fx';
    }

    if (
      assetClass.includes('index') ||
      item.name?.toLowerCase().includes('index') ||
      symbol.includes('.I')
    ) {
      return 'indices';
    }

    if (
      assetClass.includes('commodity') ||
      symbol.includes('XAU') ||
      symbol.includes('XAG') ||
      symbol.includes('OIL') ||
      symbol.includes('BRENT')
    ) {
      return 'commodities';
    }

    return 'crypto';
  }

  return provider === 'MOEX' ? 'equities' : 'crypto';
};

const getAllAssetsFromProvider = async (
  dispatch: any,
  provider: 'binance' | 'moex',
  filters?: CatalogFilters,
): Promise<CatalogItem[]> => {
  try {
    const filter = provider === 'binance' ? 'u' : '';

    const items = await searchAssets(dispatch, {
      query: filter,
      provider: provider.toUpperCase() as any,
    });

    console.log(`All assets ${provider}:`, items);

    if (filters) {
      return applyFiltersToItems(items, filters);
    }

    return items;
  } catch (error) {
    console.error(`Ошибка при получении активов ${provider}:`, error);
    return [];
  }
};

const applyFiltersToItems = (
  items: CatalogItem[],
  filters: CatalogFilters,
): CatalogItem[] => {
  let filtered = [...items];

  const activeCategories = Object.entries(filters.categories)
    .filter(([_, isActive]) => isActive)
    .map(([category]) => category);

  if (activeCategories.length > 0) {
    filtered = filtered.filter((item) => {
      const itemCategory = detectAssetCategory(item);
      return activeCategories.includes(itemCategory);
    });
  }

  filtered.sort((a, b) => {
    const nameA = a.name || a.symbol;
    const nameB = b.name || b.symbol;
    if (filters.order === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });

  return filtered;
};

interface AssetCatalogPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSelect?: (item: { symbol: string; provider: 'binance' | 'moex' }) => void;
  onClose: () => void;
}

export const AssetCatalogPanel: React.FC<AssetCatalogPanelProps> = ({
  query,
  onQueryChange,
  onSelect,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const results = useAppSelector(selectCatalogResults);
  const loading = useAppSelector(selectIsSearching);
  const error = useAppSelector(selectCatalogError);
  const provider = useAppSelector(selectCurrentProvider);
  const recent = useAppSelector(selectRecent);

  const abortRef = useRef<AbortController | null>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  const [selectedForAdd, setSelectedForAdd] = useState<{
    symbol: string;
    provider: 'binance' | 'moex';
  } | null>(null);

  const [filterClicked, setFilterClicked] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>({
    categories: {
      equities: false,
      indices: false,
      fx: false,
      crypto: false,
      commodities: false,
      bonds: false,
    },
    order: 'asc',
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target as Node)
      ) {
        setFilterClicked(false);
      }
    }

    if (filterClicked) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterClicked]);

  const performSearch = useCallback(
    async (q: string) => {
      console.log(`Поиск: "${q}", провайдер: ${provider}, фильтры:`, filters);

      if (q.length < 2) {
        try {
          const all = await getAllAssetsFromProvider(
            dispatch,
            provider,
            filters,
          );
          console.log(`Получено активов после фильтрации: ${all.length}`, all);
          dispatch(searchSucceeded(all));
          setSelectedForAdd(null);
        } catch (error) {
          console.error('Ошибка при получении всех активов:', error);
          dispatch(searchFailed('Failed to load assets'));
        }
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      dispatch(searchStarted());

      try {
        const items = await searchAssets(dispatch, {
          query: q,
          provider: provider.toUpperCase() as any,
        });

        console.log(`Результаты поиска "${q}":`, items);

        const filteredItems = applyFiltersToItems(items, filters);

        if (!abortRef.current?.signal.aborted) {
          dispatch(searchSucceeded(filteredItems));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Ошибка поиска:', err);
          dispatch(searchFailed('Search failed'));
        }
      }
    },
    [dispatch, provider, filters],
  );

  const debouncedSearch = useMemo(
    () => debounce(performSearch, DEBOUNCE_MS),
    [performSearch],
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      abortRef.current?.abort();
    };
  }, [debouncedSearch]);

  const handleFilterClick = () => {
    setFilterClicked((v) => !v);
  };

  const applyFiltersHandler = () => {
    console.log('Применяем фильтры:', filters);
    // Триггерим новый поиск с текущим запросом
    performSearch(query);
    setFilterClicked(false);
  };

  const resetFilters = () => {
    setFilters({
      categories: {
        equities: false,
        indices: false,
        fx: false,
        crypto: false,
        commodities: false,
        bonds: false,
      },
      order: 'asc',
    });
  };

  const handleItemClick = (item: CatalogItem) => {
    setSelectedForAdd({
      symbol: item.symbol,
      provider: item.provider.toLowerCase() as 'binance' | 'moex',
    });
  };

  const handleAddClick = () => {
    if (!selectedForAdd) return;

    dispatch(setSelected(selectedForAdd));
    dispatch(addRecent(selectedForAdd));

    onSelect?.(selectedForAdd);
    onClose();
  };

  const handleRecentItemClick = (recentItem: {
    symbol: string;
    provider: 'binance' | 'moex';
  }) => {
    dispatch(setSelected(recentItem));
    dispatch(addRecent(recentItem));
    onSelect?.(recentItem);
    onClose();
  };

  const showAllAssets = !query || query.length < 2;
  const displayItems = results;

  const activeFilterCount = Object.values(filters.categories).filter(
    Boolean,
  ).length;

  return (
    <div className="px-6 pt-6 pb-6 flex flex-col h-full">
      <h1 className="find-assets-title text-center mb-6">Find Assets</h1>

      {/* Search with filter */}
      <div className="relative">
        <div className="find-assets-search-wrapper mb-6">
          <svg
            className="find-assets-search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search for asset..."
            className="find-assets-search-input"
            autoFocus
          />

          <button
            className={`find-assets-filter-icon relative ${activeFilterCount < 6 ? 'text-gradient-primary' : ''}`}
            onClick={handleFilterClick}
            aria-label="Фильтры"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        </div>

        {/* Filter Popover */}
        {filterClicked && (
          <div
            ref={filterPopoverRef}
            role="dialog"
            aria-label="Asset filters"
            className="absolute left-1/2 transform -translate-x-1/2 mt-2 z-50 w-96"
          >
            <div className="bg-surface-dark/95 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-2xl">
              <div className="filter-popover-content">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-lg font-bold">Filters</h3>
                  <div className="flex gap-6">
                    <button
                      onClick={() => {
                        const allTrue = Object.keys(filters.categories).reduce(
                          (acc, key) => ({
                            ...acc,
                            [key]: true,
                          }),
                          {},
                        );
                        setFilters((f) => ({
                          ...f,
                          categories: allTrue as any,
                        }));
                      }}
                      className="text-med text-white/60 hover:text-white transition-colors"
                    >
                      Select all
                    </button>
                    <button
                      onClick={resetFilters}
                      className="text-med text-white/60 hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="filter-section mb-6 gap-3">
                  <div className="text-white/70 text-sm font-semibold mb-3 ">
                    Categories
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <label
                        key={key}
                        className="filter-label flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={
                            filters.categories[
                              key as keyof typeof CATEGORY_LABELS
                            ]
                          }
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFilters((f) => ({
                              ...f,
                              categories: {
                                ...f.categories,
                                [key]: checked,
                              },
                            }));
                          }}
                          className="filter-checkbox w-6 h-8 rounded border-white/20 bg-white/10 checked:bg-gradient-primary focus:ring-0"
                        />
                        <span className="text-white flex-1">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-section mb-8 gap-3">
                  <div className="text-white/70 text-sm font-semibold mb-3">
                    Sorting
                  </div>
                  <div className="filter-options space-y-2">
                    <label className="filter-label flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="order"
                        value="asc"
                        checked={filters.order === 'asc'}
                        onChange={() =>
                          setFilters((f) => ({ ...f, order: 'asc' }))
                        }
                        className="filter-radio w-6 h-8 border-white/20 bg-white/10 checked:bg-gradient-primary focus:ring-0"
                      />
                      <span className="text-white">
                        The direct order (A → Z)
                      </span>
                    </label>
                    <label className="filter-label flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="order"
                        value="desc"
                        checked={filters.order === 'desc'}
                        onChange={() =>
                          setFilters((f) => ({ ...f, order: 'desc' }))
                        }
                        className="filter-radio w-6 h-8 border-white/20 bg-white/10 checked:bg-gradient-primary focus:ring-0"
                      />
                      <span className="text-white">
                        The reverse order (Z → A)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={applyFiltersHandler}
                    className="flex-1 py-3 bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Apply ({activeFilterCount})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provider tabs */}
      <div className="flex justify-center -mt-2 mb-5">
        <div className="auth-tabs provider-tabs-under-search" role="tablist">
          {(['binance', 'moex'] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={provider === p}
              onClick={() => {
                console.log(`Переключение на провайдера: ${p}`);
                dispatch(setProvider(p));
                setSelectedForAdd(null);
              }}
              className="tab-button"
              style={{ padding: '0.5rem 2.2rem', fontSize: '1.2rem' }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="overflow-y-auto pb-2"
        style={{
          height: 'calc(60vh - 10rem)',
        }}
      >
        {/* Recent */}
        {!query && recent.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white text-med font-semibold mb-3 px-2">
              Recently used
            </h3>

            <div className="flex flex-col gap-1">
              {recent.map((r) => (
                <button
                  key={`${r.provider}-${r.symbol}`}
                  onClick={() => handleRecentItemClick(r)}
                  className="w-full text-left px-6 py-5 bg-black/25 rounded-2xl hover:bg-surface-dark/80 transition-all duration-300 flex justify-between items-center backdrop-blur-sm border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink text-lg truncate">
                      {r.symbol}
                    </div>
                    <div className="text-sm text-white/80 truncate mt-1">
                      {r.symbol}
                    </div>
                    <div className="text-xs text-white/50 capitalize mt-2 opacity-80">
                      {r.provider === 'binance' ? 'crypto' : 'stock'}
                    </div>
                  </div>

                  <span className="ml-4 px-4 py-2 rounded-full text-xs font-bold bg-gradient-primary text-white shadow-glow">
                    {r.provider.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center h-32 text-ink-muted text-lg">
            Searching...
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-32 text-error text-lg">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          query.length >= 2 &&
          displayItems.length === 0 && (
            <div className="flex items-center justify-center h-32 text-white/50">
              No assets found for "{query}"
            </div>
          )}

        {/* Items */}
        {!loading && !error && displayItems.length > 0 && (
          <div className="flex flex-col gap-1">
            {showAllAssets && !query && (
              <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="text-white text-med font-semibold">
                  All assets ({provider.toUpperCase()})
                </h3>
                <div className="flex items-center gap-2">
                  {activeFilterCount < 6 && (
                    <span className="text-sm text-white/50">
                      {activeFilterCount} filters
                    </span>
                  )}
                  <span className="text-sm bg-white/10 text-white/70 px-2 py-1 rounded">
                    {displayItems.length} found
                  </span>
                </div>
              </div>
            )}

            {displayItems.map((item) => {
              const lowerProvider = item.provider.toLowerCase() as
                | 'binance'
                | 'moex';
              const category = detectAssetCategory(item);

              const isSelected =
                selectedForAdd?.symbol === item.symbol &&
                selectedForAdd?.provider === lowerProvider;

              return (
                <button
                  key={`${item.symbol}-${item.provider}`}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-6 py-5 rounded-2xl transition-all bg-black/25 duration-300 flex justify-between items-center group backdrop-blur-sm border ${
                    isSelected
                      ? 'bg-gradient-primary/20 border-gradient-primary shadow-glow'
                      : 'bg-surface-dark/40 hover:bg-surface-dark/80 border-white/5'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-ink text-lg truncate">
                        {item.symbol}
                      </div>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/70">
                        {CATEGORY_LABELS[category]}
                      </span>
                    </div>
                    <div className="text-sm text-white/80 truncate mt-1">
                      {item.name || item.symbol}
                    </div>
                    {item.assetClass && (
                      <div className="text-xs text-white/50 capitalize mt-2 opacity-80">
                        {item.assetClass}
                      </div>
                    )}
                  </div>

                  <span className="ml-4 px-4 py-2 rounded-full text-xs font-bold bg-gradient-primary text-white shadow-glow">
                    {item.provider.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="absolute inset-x-6 bottom-6 z-10">
        <div className="flex justify-center">
          <button
            onClick={handleAddClick}
            disabled={!selectedForAdd}
            className="find-assets-add-button w-full max-w-md shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedForAdd
              ? `Add ${selectedForAdd.symbol} · ${selectedForAdd.provider.toUpperCase()}`
              : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};
