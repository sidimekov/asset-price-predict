'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/store';

export type Provider = 'binance' | 'moex';

export type CatalogItem = {
  symbol: string;
  name: string;
  exchange?: string;
  assetClass?: 'equity' | 'fx' | 'crypto' | 'etf' | 'bond' | string;
  currency?: string;
  provider: Provider;
};

export type RecentItem = {
  symbol: string;
  provider: Provider;
  usedAt: string;
};

export interface CatalogState {
  selected?: { symbol: string; provider: Provider };
  results: CatalogItem[];
  recent: RecentItem[];
  loading: boolean;
  error: string | null;
  query: string;
  provider: Provider;
}

const RECENT_KEY = 'asset_catalog_recent';
const MAX_RECENT = 10;

const loadRecentFromStorage = (): RecentItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveRecentToStorage = (items: RecentItem[]) => {
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(items.slice(0, MAX_RECENT)),
    );
  } catch {}
};

const initialState: CatalogState = {
  results: [],
  recent: loadRecentFromStorage(),
  loading: false,
  error: null,
  query: '',
  provider: 'binance',
};

export const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setProvider: (state, action: PayloadAction<Provider>) => {
      state.provider = action.payload;
      state.results = [];
      state.query = '';
    },

    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },

    searchStarted: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
      state.query = action.payload;
      state.results = [];
    },

    searchSucceeded: (state, action: PayloadAction<CatalogItem[]>) => {
      state.loading = false;
      state.results = action.payload;
    },

    searchFailed: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.results = [];
    },

    setSelected: (
      state,
      action: PayloadAction<{ symbol: string; provider: Provider } | undefined>,
    ) => {
      state.selected = action.payload ?? undefined;
    },

    addRecent: (
      state,
      action: PayloadAction<{ symbol: string; provider: Provider }>,
    ) => {
      const newItem: RecentItem = {
        ...action.payload,
        usedAt: new Date().toISOString(),
      };

      state.recent = [
        newItem,
        ...state.recent.filter(
          (i) =>
            !(i.symbol === newItem.symbol && i.provider === newItem.provider),
        ),
      ].slice(0, MAX_RECENT);

      saveRecentToStorage(state.recent);
    },
  },
});

export const {
  setProvider,
  setQuery,
  searchStarted,
  searchSucceeded,
  searchFailed,
  setSelected,
  addRecent,
} = catalogSlice.actions;

export const selectCatalogResults = (state: RootState) => state.catalog.results;
export const selectIsSearching = (state: RootState) => state.catalog.loading;
export const selectCatalogError = (state: RootState) => state.catalog.error;
export const selectCurrentProvider = (state: RootState) =>
  state.catalog.provider;
export const selectSelectedAsset = (state: RootState) => state.catalog.selected;
export const selectRecent = (state: RootState) => state.catalog.recent;

export default catalogSlice.reducer;
