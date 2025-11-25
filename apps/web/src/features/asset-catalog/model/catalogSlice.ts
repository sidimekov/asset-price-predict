import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/store';
import type { CatalogItem } from '@shared/types/market';

export type Provider = 'binance' | 'moex';

export type RecentItem = {
  symbol: string;
  provider: Provider;
  usedAt: string;
};

interface CatalogState {
  provider: Provider;
  query: string;
  results: CatalogItem[];
  recent: RecentItem[];
  selected?: { symbol: string; provider: Provider };
  loading: boolean;
  error: string | null;
}

const RECENT_KEY = 'asset_catalog_recent';
const MAX_RECENT = 10;

const loadRecent = (): RecentItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const saveRecent = (items: RecentItem[]) => {
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(items.slice(0, MAX_RECENT)),
    );
  } catch {}
};

const initialState: CatalogState = {
  provider: 'binance',
  query: '',
  results: [],
  recent: loadRecent(),
  loading: false,
  error: null,
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
    searchStarted: (state) => {
      state.loading = true;
      state.error = null;
      state.results = [];
    },
    searchSucceeded: (state, action: PayloadAction<CatalogItem[]>) => {
      state.loading = false;
      state.results = action.payload;
    },
    searchFailed: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelected: (
      state,
      action: PayloadAction<{ symbol: string; provider: Provider } | undefined>,
    ) => {
      state.selected = action.payload;
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
      saveRecent(state.recent);
    },
    removeRecent: (
      state,
      action: PayloadAction<{ symbol: string; provider: Provider }>,
    ) => {
      const { symbol, provider } = action.payload;
      state.recent = state.recent.filter(
        (item) => !(item.symbol === symbol && item.provider === provider),
      );
      saveRecent(state.recent);
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
  removeRecent,
} = catalogSlice.actions;

export const selectCurrentProvider = (state: RootState): Provider =>
  state.catalog.provider;
export const selectCatalogResults = (state: RootState): CatalogItem[] =>
  state.catalog.results;
export const selectIsSearching = (state: RootState): boolean =>
  state.catalog.loading;
export const selectCatalogError = (state: RootState): string | null =>
  state.catalog.error;
export const selectRecent = (state: RootState): RecentItem[] =>
  state.catalog.recent;
export const selectSelectedAsset = (state: RootState) => state.catalog.selected;

export default catalogSlice.reducer;
