import { expect, it, describe, beforeEach, vi } from 'vitest';
import { catalogSlice } from '@/features/asset-catalog/model/catalogSlice';
import {
  addRecent,
  setProvider,
  searchStarted,
  searchSucceeded,
  searchFailed,
  setSelected,
  removeRecent,
  setQuery,
} from '@/features/asset-catalog/model/catalogSlice';
import type { CatalogItem } from '@shared/types/market';

// Сначала объявите все типы
type Provider = 'binance' | 'moex';
type RecentItem = {
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

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const initialState = (): CatalogState => ({
  results: [],
  recent: [],
  loading: false,
  error: null,
  query: '',
  provider: 'binance',
  selected: undefined,
});

// Вспомогательная функция для создания CatalogItem
const createCatalogItem = (
  symbol: string,
  name: string,
  provider: 'BINANCE' | 'MOEX',
): CatalogItem => ({
  symbol,
  name,
  provider,
  exchange: provider,
  assetClass: provider === 'BINANCE' ? 'crypto' : 'equity',
  currency: provider === 'BINANCE' ? 'USDT' : 'RUB',
});

describe('catalogSlice', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns empty recent array if localStorage has invalid JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('corrupted data');

      const state = catalogSlice.reducer(undefined, { type: 'unknown' });
      expect(state.recent).toEqual([]);
    });

    it('returns empty recent array if localStorage is empty', () => {
      const state = catalogSlice.reducer(undefined, { type: 'unknown' });
      expect(state.recent).toEqual([]);
    });
  });

  describe('setProvider', () => {
    it('changes provider and clears results + query', () => {
      const state = catalogSlice.reducer(
        {
          ...initialState(),
          provider: 'binance',
          results: [createCatalogItem('X', 'Test Asset', 'BINANCE')],
          query: 'test',
        },
        setProvider('moex'),
      );

      expect(state.provider).toBe('moex');
      expect(state.results).toEqual([]);
      expect(state.query).toBe('');
    });
  });

  describe('setQuery', () => {
    it('sets query string', () => {
      const state = catalogSlice.reducer(initialState(), setQuery('AAPL'));

      expect(state.query).toBe('AAPL');
    });
  });

  describe('addRecent', () => {
    it('adds new item to the front with current timestamp', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-17T12:00:00Z'));

      const state = catalogSlice.reducer(
        initialState(),
        addRecent({ symbol: 'BTCUSDT', provider: 'binance' }),
      );

      expect(state.recent[0]).toEqual({
        symbol: 'BTCUSDT',
        provider: 'binance',
        usedAt: '2025-11-17T12:00:00.000Z',
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'asset_catalog_recent',
        JSON.stringify(state.recent),
      );

      vi.useRealTimers();
    });

    it('moves existing item to front and updates timestamp', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-17T13:00:00Z'));

      const prevState = initialState();
      prevState.recent = [
        {
          symbol: 'ETHUSDT',
          provider: 'binance',
          usedAt: '2025-01-01T00:00:00Z',
        },
        {
          symbol: 'BTCUSDT',
          provider: 'binance',
          usedAt: '2025-01-02T00:00:00Z',
        },
      ];

      const state = catalogSlice.reducer(
        prevState,
        addRecent({ symbol: 'BTCUSDT', provider: 'binance' }),
      );

      expect(state.recent).toHaveLength(2);
      expect(state.recent[0].symbol).toBe('BTCUSDT');
      expect(state.recent[0].usedAt).toBe('2025-11-17T13:00:00.000Z');
      expect(state.recent[1].symbol).toBe('ETHUSDT');

      vi.useRealTimers();
    });

    it('limits recent items to MAX_RECENT', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-17T12:00:00Z'));

      const prevState = initialState();
      // Create more than MAX_RECENT items
      prevState.recent = Array.from({ length: 15 }, (_, i) => ({
        symbol: `ASSET${i}`,
        provider: 'binance',
        usedAt: `2025-01-0${i + 1}T00:00:00Z`,
      }));

      const state = catalogSlice.reducer(
        prevState,
        addRecent({ symbol: 'NEWASSET', provider: 'binance' }),
      );

      expect(state.recent).toHaveLength(10); // MAX_RECENT
      expect(state.recent[0].symbol).toBe('NEWASSET');

      vi.useRealTimers();
    });
  });

  describe('removeRecent', () => {
    it('removes item by symbol and provider', () => {
      const prevState = initialState();
      prevState.recent = [
        {
          symbol: 'BTCUSDT',
          provider: 'binance',
          usedAt: '2025-01-01T00:00:00Z',
        },
        {
          symbol: 'ETHUSDT',
          provider: 'binance',
          usedAt: '2025-01-02T00:00:00Z',
        },
        { symbol: 'SBER', provider: 'moex', usedAt: '2025-01-03T00:00:00Z' },
      ];

      const state = catalogSlice.reducer(
        prevState,
        removeRecent({ symbol: 'ETHUSDT', provider: 'binance' }),
      );

      expect(state.recent).toHaveLength(2);
      expect(
        state.recent.find((item) => item.symbol === 'ETHUSDT'),
      ).toBeUndefined();
      expect(state.recent[0].symbol).toBe('BTCUSDT');
      expect(state.recent[1].symbol).toBe('SBER');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'asset_catalog_recent',
        JSON.stringify(state.recent),
      );
    });

    it('does nothing when removing non-existent item', () => {
      const prevState = initialState();
      prevState.recent = [
        {
          symbol: 'BTCUSDT',
          provider: 'binance',
          usedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const state = catalogSlice.reducer(
        prevState,
        removeRecent({ symbol: 'NONEXISTENT', provider: 'binance' }),
      );

      expect(state.recent).toHaveLength(1);
      expect(state.recent[0].symbol).toBe('BTCUSDT');
    });

    it('handles provider-specific removal correctly', () => {
      const prevState = initialState();
      prevState.recent = [
        {
          symbol: 'BTCUSDT',
          provider: 'binance',
          usedAt: '2025-01-01T00:00:00Z',
        },
        { symbol: 'BTCUSDT', provider: 'moex', usedAt: '2025-01-02T00:00:00Z' },
      ];

      const state = catalogSlice.reducer(
        prevState,
        removeRecent({ symbol: 'BTCUSDT', provider: 'binance' }),
      );

      expect(state.recent).toHaveLength(1);
      expect(state.recent[0].provider).toBe('moex');
    });
  });

  describe('setSelected', () => {
    it('sets selected asset', () => {
      const state = catalogSlice.reducer(
        initialState(),
        setSelected({ symbol: 'SBER', provider: 'moex' }),
      );
      expect(state.selected).toEqual({ symbol: 'SBER', provider: 'moex' });
    });

    it('clears selected when undefined passed', () => {
      const state = catalogSlice.reducer(
        { ...initialState(), selected: { symbol: 'X', provider: 'binance' } },
        setSelected(undefined),
      );
      expect(state.selected).toBeUndefined();
    });
  });

  describe('search flow', () => {
    it('searchStarted — sets loading, clears results/error', () => {
      const state = catalogSlice.reducer(
        {
          ...initialState(),
          error: 'boom',
          results: [createCatalogItem('OLD', 'Old Asset', 'BINANCE')],
        },
        searchStarted(),
      );

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.results).toEqual([]);
    });

    it('searchSucceeded — sets results and stops loading', () => {
      const results = [createCatalogItem('AAPL', 'Apple Inc.', 'BINANCE')];

      const state = catalogSlice.reducer(
        { ...initialState(), loading: true },
        searchSucceeded(results),
      );

      expect(state.results).toEqual(results);
      expect(state.loading).toBe(false);
    });

    it('searchFailed — sets error and stops loading', () => {
      const state = catalogSlice.reducer(
        { ...initialState(), loading: true },
        searchFailed('Network timeout'),
      );

      expect(state.error).toBe('Network timeout');
      expect(state.loading).toBe(false);
      expect(state.results).toEqual([]);
    });
  });

  describe('saveRecent error handling', () => {
    it('handles localStorage setItem errors gracefully', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-17T12:00:00Z'));

      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      const state = catalogSlice.reducer(
        initialState(),
        addRecent({ symbol: 'BTCUSDT', provider: 'binance' }),
      );

      // Should still update state even if localStorage fails
      expect(state.recent[0]).toEqual({
        symbol: 'BTCUSDT',
        provider: 'binance',
        usedAt: '2025-11-17T12:00:00.000Z',
      });

      vi.useRealTimers();
    });
  });
});
