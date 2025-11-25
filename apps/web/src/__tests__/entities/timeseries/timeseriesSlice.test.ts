import { describe, it, expect } from 'vitest';
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
  selectIsLoading,
  selectError,
  selectTailForFeatures,
  selectIsStale,
} from '@/entities/timeseries/model/selectors';

const key = buildTimeseriesCacheKey('MOCK' as any, 'BTCUSDT', '1h' as any, 100);

const makeRootState = (timeseriesState: any): RootState =>
  ({ timeseries: timeseriesState }) as unknown as RootState;

describe('timeseriesSlice reducers', () => {
  it('sets loading and clears error on timeseriesRequested', () => {
    const prevState = timeseriesReducer(undefined, { type: '@@INIT' } as any);

    const state = timeseriesReducer(prevState, timeseriesRequested({ key }));

    expect(state.loadingByKey[key]).toBe(true);
    expect(state.errorByKey[key]).toBeNull();
  });

  it('stores bars and fetchedAt on timeseriesReceived', () => {
    const bars: Bar[] = [[1, 2, 3, 1, 2, 10]];
    const fetchedAt = '2024-01-01T00:00:00.000Z';

    const state = timeseriesReducer(
      undefined,
      timeseriesReceived({ key, bars, fetchedAt }),
    );

    expect(state.byKey[key]).toEqual({ bars, fetchedAt });
    expect(state.loadingByKey[key]).toBe(false);
    expect(state.errorByKey[key]).toBeNull();
  });

  it('overwrites existing entry on repeated timeseriesReceived', () => {
    const firstBars: Bar[] = [[1, 2, 3, 1, 2, 10]];
    const secondBars: Bar[] = [[2, 3, 4, 2, 3, 20]];

    const firstState = timeseriesReducer(
      undefined,
      timeseriesReceived({
        key,
        bars: firstBars,
        fetchedAt: '2024-01-01T00:00:00.000Z',
      }),
    );

    const secondState = timeseriesReducer(
      firstState,
      timeseriesReceived({
        key,
        bars: secondBars,
        fetchedAt: '2024-01-02T00:00:00.000Z',
      }),
    );

    expect(secondState.byKey[key]).toEqual({
      bars: secondBars,
      fetchedAt: '2024-01-02T00:00:00.000Z',
    });
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

  it('clears single key on clearTimeseries', () => {
    const bars: Bar[] = [[1, 2, 3, 1, 2, 10]];
    const fetchedAt = '2024-01-01T00:00:00.000Z';

    const withData = timeseriesReducer(
      undefined,
      timeseriesReceived({ key, bars, fetchedAt }),
    );

    const cleared = timeseriesReducer(withData, clearTimeseries(key));

    expect(cleared.byKey[key]).toBeUndefined();
    expect(cleared.loadingByKey[key]).toBeUndefined();
    expect(cleared.errorByKey[key]).toBeUndefined();
  });

  it('resets whole slice on clearAllTimeseries', () => {
    const bars: Bar[] = [[1, 2, 3, 1, 2, 10]];
    const fetchedAt = '2024-01-01T00:00:00.000Z';

    const withData = timeseriesReducer(
      undefined,
      timeseriesReceived({ key, bars, fetchedAt }),
    );

    const cleared = timeseriesReducer(withData, clearAllTimeseries());

    expect(cleared.byKey).toEqual({});
    expect(cleared.loadingByKey).toEqual({});
    expect(cleared.errorByKey).toEqual({});
  });
});

describe('timeseries selectors', () => {
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
    expect(selectBarsByKey(rootState, 'UNKNOWN_KEY')).toBeUndefined();
  });

  it('selectIsLoading and selectError work correctly', () => {
    const rootState = makeRootState({
      byKey: {},
      loadingByKey: { [key]: true },
      errorByKey: { [key]: 'boom' },
    });

    expect(selectIsLoading(rootState, key)).toBe(true);
    expect(selectIsLoading(rootState, 'UNKNOWN_KEY')).toBe(false);

    expect(selectError(rootState, key)).toBe('boom');
    expect(selectError(rootState, 'UNKNOWN_KEY')).toBeNull();
  });

  it('selectTailForFeatures returns last n [ts, close] points', () => {
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

    const tail = selectTailForFeatures(rootState, { key, n: 2 });
    expect(tail).toEqual([
      [2000, 2.5],
      [3000, 3.5],
    ]);

    const fullTail = selectTailForFeatures(rootState, { key, n: 10 });
    expect(fullTail).toEqual([
      [1000, 1.5],
      [2000, 2.5],
      [3000, 3.5],
    ]);

    const emptyTail = selectTailForFeatures(rootState, {
      key: 'UNKNOWN_KEY',
      n: 2,
    });
    expect(emptyTail).toEqual([]);
  });

  it('selectIsStale returns false for fresh data and true for stale or missing', () => {
    const freshFetchedAt = new Date().toISOString();
    const staleFetchedAt = new Date(Date.now() - 11 * 60 * 1000).toISOString();

    const bars: Bar[] = [];

    const stateFresh = makeRootState({
      byKey: { [key]: { bars, fetchedAt: freshFetchedAt } },
      loadingByKey: {},
      errorByKey: {},
    });

    const stateStale = makeRootState({
      byKey: { [key]: { bars, fetchedAt: staleFetchedAt } },
      loadingByKey: {},
      errorByKey: {},
    });

    const stateEmpty = makeRootState({
      byKey: {},
      loadingByKey: {},
      errorByKey: {},
    });

    expect(selectIsStale(stateFresh, key)).toBe(false);
    expect(selectIsStale(stateStale, key)).toBe(true);
    expect(selectIsStale(stateEmpty, key)).toBe(true);
  });
});
