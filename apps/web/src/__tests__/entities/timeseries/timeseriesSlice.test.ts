import { describe, it, expect } from 'vitest';
import {
  timeseriesReducer,
  timeseriesRequested,
  timeseriesReceived,
  timeseriesFailed,
  buildTimeseriesKey,
} from '@/entities/timeseries/model/timeseriesSlice';
import type { Bar } from '@/features/market-adapter/cache/ClientTimeseriesCache';

const key = buildTimeseriesKey('MOCK', 'BTCUSDT', '1h');

describe('timeseriesSlice', () => {
  it('sets loading on requested', () => {
    const state = timeseriesReducer(undefined, timeseriesRequested({ key }));

    expect(state.loadingByKey[key]).toBe(true);
    expect(state.errorByKey[key]).toBeNull();
  });

  it('stores bars on received', () => {
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

  it('stores error on failed', () => {
    const error = 'oops';

    const state = timeseriesReducer(
        undefined,
        timeseriesFailed({ key, error }),
    );

    expect(state.loadingByKey[key]).toBe(false);
    expect(state.errorByKey[key]).toBe(error);
  });
});