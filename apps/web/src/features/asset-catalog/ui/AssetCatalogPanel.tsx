'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  removeRecent,
} from '../model/catalogSlice';
import { searchAssets } from '@/features/market-adapter/MarketAdapter';
import type { CatalogItem } from '@shared/types/market';
import debounce from 'lodash.debounce';

const DEBOUNCE_MS = 400;

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
  const provider = useAppSelector(selectCurrentProvider); // 'binance' | 'moex'
  const recent = useAppSelector(selectRecent);

  const abortRef = useRef<AbortController | null>(null);
  const [selectedForAdd, setSelectedForAdd] = useState<{
    symbol: string;
    provider: 'binance' | 'moex';
  } | null>(null);

  const performSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        dispatch(searchSucceeded([]));
        setSelectedForAdd(null);
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      dispatch(searchStarted());

      try {
        const items = await searchAssets(dispatch, {
          query: q,
          provider: provider === 'binance' ? 'BINANCE' : 'MOEX',
        });

        if (!abortRef.current?.signal.aborted) {
          dispatch(searchSucceeded(items));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          dispatch(searchFailed('Search failed'));
        }
      }
    },
    [dispatch, provider],
  );

  const debouncedSearch = React.useMemo(
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

  const handleItemClick = (item: CatalogItem) => {
    const lowerProvider = item.provider.toLowerCase() as 'binance' | 'moex';
    setSelectedForAdd({
      symbol: item.symbol,
      provider: lowerProvider,
    });
  };

  const handleAddClick = () => {
    if (selectedForAdd) {
      dispatch(setSelected(selectedForAdd));
      dispatch(addRecent(selectedForAdd));
      onSelect?.(selectedForAdd);
      onClose();
    }
  };

  const handleRecentItemClick = (item: {
    symbol: string;
    provider: 'binance' | 'moex';
  }) => {
    dispatch(setSelected(item));
    dispatch(addRecent(item));
    onSelect?.(item);
    onClose();
  };

  return (
    <div className="px-6 pt-6 pb-24 flex flex-col h-full ">
      <h1 className="find-assets-title text-center mb-6">Find Assets</h1>

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
          className="find-assets-filter-icon"
          onClick={(e) => e.stopPropagation()}
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

      <div className="flex justify-center -mt-2 mb-5">
        <div className="auth-tabs provider-tabs-under-search" role="tablist">
          {(['binance', 'moex'] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={provider === p}
              onClick={() => {
                dispatch(setProvider(p));
                setSelectedForAdd(null);
              }}
              className="tab-button"
              style={{
                padding: '0.5rem 2.2rem',
                fontSize: '1.2rem',
              }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {!query && recent.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white text-sm font-semibold mb-3 px-2">
              Recent
            </h3>
            <div className="space-y-3">
              {recent.map((item) => (
                <div
                  key={`${item.provider}-${item.symbol}`}
                  className="relative group"
                >
                  <button
                    onClick={() => handleRecentItemClick(item)}
                    className="w-full text-left px-6 py-5 rounded-2xl bg-surface-dark/40 hover:bg-surface-dark/80 transition-all duration-300 flex justify-between items-center backdrop-blur-sm border border-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-ink text-lg">
                        {item.symbol}
                      </div>
                      <div className="text-sm text-white/50">Recently used</div>
                    </div>
                    <span className="ml-4 px-4 py-2 rounded-full text-xs font-bold bg-gradient-primary text-white shadow-glow">
                      {item.provider.toUpperCase()}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {!loading && !error && query.length >= 2 && results.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/50">
            No assets found for “{query}”
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((item) => {
              const lowerProvider = item.provider.toLowerCase() as
                | 'binance'
                | 'moex';
              const isSelected =
                selectedForAdd?.symbol === item.symbol &&
                selectedForAdd?.provider === lowerProvider;

              return (
                <button
                  key={`${item.symbol}-${item.provider}`}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-6 py-5 rounded-2xl transition-all duration-300 flex justify-between items-center group backdrop-blur-sm border ${
                    isSelected
                      ? 'bg-gradient-primary/20 border-gradient-primary shadow-glow'
                      : 'bg-surface-dark/40 hover:bg-surface-dark/80 border-white/5'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-ink text-lg truncate">
                      {item.symbol}
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

      <div className="absolute inset-x-6 bottom-6 z-10 pointer-events-none">
        <div className="flex justify-center pointer-events-auto">
          <button
            onClick={handleAddClick}
            disabled={!selectedForAdd}
            className="find-assets-add-button w-full max-w-md shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedForAdd ? (
              <>
                Add {selectedForAdd.symbol} ·{' '}
                {selectedForAdd.provider.toUpperCase()}
              </>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
