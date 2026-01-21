import { describe, it, expect, vi } from 'vitest';
import type { Bar } from '@shared/types/market';
import type { RootState } from '@/shared/store';
import { buildTimeseriesCacheKey } from '@/shared/lib/cacheKey';

import {
  timeseriesReducer,
  timeseriesRequested,
  timeseriesReceived,
  timeseriesFailed,
  clearTimeseries,
  clearAllTimeseries,
} from '@/entities/timeseries/model/timeseriesSlice';

import {
  selectBarsByKey,
  selectFetchedAtByKey,
  selectIsLoading,
  selectError,
  selectTailForFeatures,
  selectIsStale,
  selectPriceChangeByAsset,
} from '@/entities/timeseries/model/selectors';

const key = buildTimeseriesCacheKey('MOCK', 'BTCUSDT', '1h', 120);

function makeRootState(timeseriesState: any): RootState {
  return {
    timeseries: timeseriesState,
  } as RootState;
}

describe('timeseriesSlice reducers', () => {
  it('sets loading and clears error on timeseriesRequested', () => {
    const prevState = timeseriesReducer(undefined, { type: 'init' });

    const state = timeseriesReducer(prevState, timeseriesRequested({ key }));

    expect(state.loadingByKey[key]).toBe(true);
    expect(state.errorByKey[key]).toBeNull();
  });

  it('stores bars and fetchedAt on timeseriesReceived', () => {
    const bars: Bar[] = [[1, 2, 3, 1, 2, 10]];
    const frozen = new Date('2024-01-01T00:00:00.000Z');

    vi.useFakeTimers();
    vi.setSystemTime(frozen);

    const state = timeseriesReducer(
      undefined,
      timeseriesReceived({ key, bars }),
    );

    expect(state.byKey[key]).toEqual({ bars, fetchedAt: frozen.toISOString() });
    expect(state.loadingByKey[key]).toBe(false);
    expect(state.errorByKey[key]).toBeNull();

    vi.useRealTimers();
  });

  it('overwrites existing entry on repeated timeseriesReceived', () => {
    const firstBars: Bar[] = [[1, 2, 3, 1, 2, 10]];
    const secondBars: Bar[] = [[2, 3, 4, 2, 3, 20]];

    vi.useFakeTimers();

    const t1 = new Date('2024-01-01T00:00:00.000Z');
    vi.setSystemTime(t1);
    const firstState = timeseriesReducer(
      undefined,
      timeseriesReceived({ key, bars: firstBars }),
    );

    const t2 = new Date('2024-01-02T00:00:00.000Z');
    vi.setSystemTime(t2);
    const secondState = timeseriesReducer(
      firstState,
      timeseriesReceived({ key, bars: secondBars }),
    );

    expect(secondState.byKey[key]).toEqual({
      bars: secondBars,
      fetchedAt: t2.toISOString(),
    });

    vi.useRealTimers();
  });

  it('stores error on timeseriesFailed', () => {
    const error = 'oops';

    const state = timeseriesReducer(
      undefined,
      timeseriesFailed({ key, error }),
    );

    expect(state.loadingByKey[key]).toBe(false);
    expect(state.errorByKey[key]).toBe(error);
  });

  it('clears entry on clearTimeseries', () => {
    const bars: Bar[] = [[1, 2, 3, 1, 2, 10]];
    const fetchedAt = new Date().toISOString();

    const prevState = makeRootState({
      byKey: { [key]: { bars, fetchedAt } },
      loadingByKey: { [key]: false },
      errorByKey: { [key]: null },
    }).timeseries;

    const state = timeseriesReducer(prevState, clearTimeseries(key));

    expect(state.byKey[key]).toBeUndefined();
    expect(state.loadingByKey[key]).toBeUndefined();
    expect(state.errorByKey[key]).toBeUndefined();
  });

  it('resets state on clearAllTimeseries', () => {
    const bars: Bar[] = [[1, 2, 3, 1, 2, 10]];
    const fetchedAt = new Date().toISOString();

    const prevState = makeRootState({
      byKey: { [key]: { bars, fetchedAt } },
      loadingByKey: { [key]: false },
      errorByKey: { [key]: null },
    }).timeseries;

    const state = timeseriesReducer(prevState, clearAllTimeseries());

    expect(state.byKey).toEqual({});
    expect(state.loadingByKey).toEqual({});
    expect(state.errorByKey).toEqual({});
  });
});

describe('timeseriesSlice selectors', () => {
  it('selectBarsByKey returns bars or undefined', () => {
    const bars: Bar[] = [
      [1000, 1, 2, 0.5, 1.5, 10],
      [2000, 2, 3, 1, 2.5, 20],
    ];
    const fetchedAt = new Date().toISOString();

    const rootState = makeRootState({
      byKey: { [key]: { bars, fetchedAt } },
      loadingByKey: {},
      errorByKey: {},
    });

    expect(selectBarsByKey(rootState, key)).toEqual(bars);
    expect(selectBarsByKey(rootState, 'missing')).toBeUndefined();
  });

  it('selectFetchedAtByKey returns fetchedAt or undefined', () => {
    const fetchedAt = new Date().toISOString();

    const rootState = makeRootState({
      byKey: { [key]: { bars: [], fetchedAt } },
      loadingByKey: {},
      errorByKey: {},
    });

    expect(selectFetchedAtByKey(rootState, key)).toBe(fetchedAt);
    expect(selectFetchedAtByKey(rootState, 'missing')).toBeUndefined();
  });

  it('selectIsLoading returns loading or false', () => {
    const rootState = makeRootState({
      byKey: {},
      loadingByKey: { [key]: true },
      errorByKey: {},
    });

    expect(selectIsLoading(rootState, key)).toBe(true);
    expect(selectIsLoading(rootState, 'missing')).toBe(false);
  });

  it('selectError returns error or null', () => {
    const rootState = makeRootState({
      byKey: {},
      loadingByKey: {},
      errorByKey: { [key]: 'oops' },
    });

    expect(selectError(rootState, key)).toBe('oops');
    expect(selectError(rootState, 'missing')).toBeNull();
  });

  it('selectTailForFeatures returns last N bars', () => {
    const bars: Bar[] = [
      [1000, 1, 2, 0.5, 1.5, 10],
      [2000, 2, 3, 1, 2.5, 20],
      [3000, 3, 4, 2, 3.5, 30],
    ];
    const fetchedAt = new Date().toISOString();

    const rootState = makeRootState({
      byKey: { [key]: { bars, fetchedAt } },
      loadingByKey: {},
      errorByKey: {},
    });

    expect(selectTailForFeatures(rootState, key, 2)).toEqual([
      bars[1],
      bars[2],
    ]);
    expect(selectTailForFeatures(rootState, key, 10)).toEqual(bars);
    expect(selectTailForFeatures(rootState, 'missing', 2)).toBeUndefined();
  });

  it('selectIsStale uses TTL and fetchedAt', () => {
    const now = 1_000_000;
    const ttlMs = 1000;

    const bars: Bar[] = [[1000, 1, 2, 0.5, 1.5, 10]];

    const stateFresh = makeRootState({
      byKey: { [key]: { bars, fetchedAt: new Date(now - 500).toISOString() } },
      loadingByKey: {},
      errorByKey: {},
    });

    const stateStale = makeRootState({
      byKey: { [key]: { bars, fetchedAt: new Date(now - 5000).toISOString() } },
      loadingByKey: {},
      errorByKey: {},
    });

    const stateEmpty = makeRootState({
      byKey: {},
      loadingByKey: {},
      errorByKey: {},
    });

    expect(selectIsStale(stateFresh, key, ttlMs, now)).toBe(false);
    expect(selectIsStale(stateStale, key, ttlMs, now)).toBe(true);
    expect(selectIsStale(stateEmpty, key, ttlMs, now)).toBe(true);
  });

  it('selectPriceChangeByAsset returns lastPrice and changePct for limit key', () => {
    const provider = 'MOCK';
    const symbol = 'BTCUSDT';
    const timeframe = '1h';
    const limit = 200;
    const targetKey = buildTimeseriesCacheKey(
      provider,
      symbol,
      timeframe,
      limit,
    );
    const otherKey = buildTimeseriesCacheKey(provider, symbol, timeframe, 500);

    const bars: Bar[] = [
      [1000, 1, 2, 0.5, 10, 10],
      [2000, 2, 3, 1, 20, 20],
    ];

    const rootState = makeRootState({
      byKey: {
        [targetKey]: { bars, fetchedAt: new Date().toISOString() },
        [otherKey]: {
          bars: [[1000, 1, 2, 0.5, 999, 10]],
          fetchedAt: new Date().toISOString(),
        },
      },
      loadingByKey: {},
      errorByKey: {},
    });

    const stats = selectPriceChangeByAsset(
      rootState,
      'MOCK',
      symbol,
      timeframe,
      limit,
    );

    expect(stats.lastPrice).toBe(20);
    expect(stats.changePct).toBe(100);
  });

  it('selectPriceChangeByAsset returns only lastPrice when one bar', () => {
    const provider = 'MOEX';
    const symbol = 'SBER';
    const timeframe = '1h';
    const limit = 120;
    const tsKey = buildTimeseriesCacheKey(provider, symbol, timeframe, limit);

    const rootState = makeRootState({
      byKey: {
        [tsKey]: {
          bars: [[1000, 1, 2, 0.5, 7, 10]],
          fetchedAt: new Date().toISOString(),
        },
      },
      loadingByKey: {},
      errorByKey: {},
    });

    const stats = selectPriceChangeByAsset(
      rootState,
      'MOEX',
      symbol,
      timeframe,
      limit,
    );

    expect(stats).toEqual({ lastPrice: 7 });
  });

  it('selectPriceChangeByAsset ignores changePct when prevClose is 0', () => {
    const provider = 'MOEX';
    const symbol = 'GAZP';
    const timeframe = '1h';
    const limit = 50;
    const tsKey = buildTimeseriesCacheKey(provider, symbol, timeframe, limit);

    const rootState = makeRootState({
      byKey: {
        [tsKey]: {
          bars: [
            [1000, 1, 2, 0.5, 0, 10],
            [2000, 2, 3, 1, 5, 20],
          ],
          fetchedAt: new Date().toISOString(),
        },
      },
      loadingByKey: {},
      errorByKey: {},
    });

    const stats = selectPriceChangeByAsset(
      rootState,
      'MOEX',
      symbol,
      timeframe,
      limit,
    );

    expect(stats).toEqual({ lastPrice: 5 });
  });

  it('selectPriceChangeByAsset skips invalid last close', () => {
    const provider = 'BINANCE';
    const symbol = 'BTCUSDT';
    const timeframe = '1h';
    const limit = 30;
    const tsKey = buildTimeseriesCacheKey(provider, symbol, timeframe, limit);

    const rootState = makeRootState({
      byKey: {
        [tsKey]: {
          bars: [
            [1000, 1, 2, 0.5, 10, 10],
            [2000, 2, 3, 1, Number.NaN, 20],
          ],
          fetchedAt: new Date().toISOString(),
        },
      },
      loadingByKey: {},
      errorByKey: {},
    });

    const stats = selectPriceChangeByAsset(
      rootState,
      'BINANCE',
      symbol,
      timeframe,
      limit,
    );

    expect(stats).toEqual({});
  });
});
