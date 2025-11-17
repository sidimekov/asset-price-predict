import { expect, it, describe, beforeEach, vi } from 'vitest';
import {
  catalogSlice,
  type CatalogState,
  type Provider,
} from '@/features/asset-catalog/model/catalogSlice';
import {
  addRecent,
  setProvider,
  searchStarted,
  searchSucceeded,
  searchFailed,
  setSelected,
} from '@/features/asset-catalog/model/catalogSlice';

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
  provider: 'binance' as Provider,
  selected: undefined,
});

describe('catalogSlice', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns empty recent array if localStorage has invalid JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('corrupted data');

      const state = catalogSlice.reducer(undefined, { type: 'INIT' });
      expect(state.recent).toEqual([]);
    });

    it('returns empty recent array if localStorage is empty', () => {
      const state = catalogSlice.reducer(undefined, { type: 'INIT' });
      expect(state.recent).toEqual([]);
    });
  });

  describe('setProvider', () => {
    it('changes provider and clears results + query', () => {
      const state = catalogSlice.reducer(
        {
          ...initialState(),
          provider: 'binance',
          results: [{ symbol: 'X', provider: 'binance', name: '' }],
          query: 'test',
        },
        setProvider('moex'),
      );

      expect(state.provider).toBe('moex');
      expect(state.results).toEqual([]);
      expect(state.query).toBe('');
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
    it('searchStarted — sets loading, clears results/error, saves query', () => {
      const state = catalogSlice.reducer(
        {
          ...initialState(),
          error: 'boom',
          results: [{ symbol: 'OLD', provider: 'binance', name: '' }],
        },
        searchStarted('AAPL'),
      );

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.results).toEqual([]);
      expect(state.query).toBe('AAPL');
    });

    it('searchSucceeded — sets results and stops loading', () => {
      const results = [
        { symbol: 'AAPL', name: 'Apple Inc.', provider: 'binance' as Provider },
      ];

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
});
