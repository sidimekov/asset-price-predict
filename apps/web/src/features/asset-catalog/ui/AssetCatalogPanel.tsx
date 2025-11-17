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
  type Provider,
} from '../model/catalogSlice';
import { normalizeCatalogResponse } from '../lib/normalizeCatalogItem';
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
  const provider = useAppSelector(selectCurrentProvider);
  const recent = useAppSelector(selectRecent);

  const [selectedForAdd, setSelectedForAdd] = useState<{
    symbol: string;
    provider: Provider;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        dispatch(searchSucceeded([]));
        setSelectedForAdd(null);
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      dispatch(searchStarted(q));

      try {
        const response = await fetch(
          `/api/market/search?q=${encodeURIComponent(q)}&provider=${provider}`,
          { signal: controller.signal },
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const rawData = await response.json();
        const normalized = normalizeCatalogResponse(rawData, provider);
        dispatch(searchSucceeded(normalized));
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        dispatch(searchFailed(err.message || 'Search failed'));
      }
    },
    [dispatch, provider],
  );

  const debouncedSearch = useRef(debounce(performSearch, DEBOUNCE_MS)).current;

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      abortControllerRef.current?.abort();
    };
  }, [debouncedSearch]);

  const handleItemClick = (item: { symbol: string; provider: Provider }) => {
    setSelectedForAdd(item);
  };

  const handleAddClick = () => {
    if (selectedForAdd) {
      dispatch(setSelected(selectedForAdd));
      dispatch(addRecent(selectedForAdd));
      onSelect?.({
        symbol: selectedForAdd.symbol,
        provider: selectedForAdd.provider,
      });
      onClose();
    }
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
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {!query && recent.length > 0 && (
          <div className="mb-6">
            <h3 className="text-ink-muted text-sm font-semibold mb-3 px-2">
              Recent
            </h3>
            <div className="space-y-3">
              {recent.map((item) => (
                <button
                  key={`${item.provider}-${item.symbol}`}
                  onClick={() => {
                    dispatch(setSelected(item));
                    dispatch(addRecent(item));
                    onSelect?.({
                      symbol: item.symbol,
                      provider: item.provider,
                    });
                    onClose();
                  }}
                  className="w-full text-left px-6 py-5 rounded-2xl bg-surface-dark/40 hover:bg-surface-dark/80 transition-all duration-300 flex justify-between items-center group backdrop-blur-sm border border-white/5"
                >
                  <div>
                    <div className="font-bold text-ink text-lg">
                      {item.symbol}
                    </div>
                    <div className="text-sm text-ink-muted">Recently used</div>
                  </div>
                  <span className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-primary text-white shadow-glow">
                    {item.provider.toUpperCase()}
                  </span>
                </button>
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
          <div className="flex items-center justify-center h-32 text-ink-muted">
            No assets found for “{query}”
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((item) => (
              <button
                key={`${item.provider}-${item.symbol}`}
                onClick={() => handleItemClick(item)}
                className={`w-full text-left px-6 py-5 rounded-2xl transition-all duration-300 flex justify-between items-center group backdrop-blur-sm border ${
                  selectedForAdd?.symbol === item.symbol &&
                  selectedForAdd?.provider === item.provider
                    ? 'bg-gradient-primary/20 border-gradient-primary shadow-glow'
                    : 'bg-surface-dark/40 hover:bg-surface-dark/80 border-white/5'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-ink text-lg truncate">
                    {item.symbol}
                  </div>
                  <div className="text-sm text-ink-muted truncate mt-1">
                    {item.name || item.symbol}
                  </div>
                  {item.assetClass && (
                    <div className="text-xs text-accent/80 capitalize mt-2 opacity-80">
                      {item.assetClass}
                    </div>
                  )}
                </div>
                <span className="ml-4 px-4 py-2 rounded-full text-xs font-bold bg-gradient-primary text-white shadow-glow">
                  {item.provider.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bottom-4 left-6 right-6 mt-auto pt-6 border-t border-white/10">
        <div className="flex justify-center">
          <button
            onClick={handleAddClick}
            className="find-assets-add-button w-full max-w-md"
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
