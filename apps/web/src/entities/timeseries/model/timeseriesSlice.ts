import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/store';
import type { Bar } from '@shared/types/market';
import {
  DEFAULT_LIMIT,
  type MarketDataProvider,
  type MarketTimeframe,
} from '@/config/market';
import type { TimeseriesCacheKey } from '@/shared/lib/cacheKey';

export type TimeseriesKey = TimeseriesCacheKey;

export const buildTimeseriesKey = (
  provider: MarketDataProvider,
  symbol: string,
  timeframe: MarketTimeframe,
  limit: number = DEFAULT_LIMIT,
): TimeseriesKey => `${provider}:${symbol}:${timeframe}:${limit}`;

interface TimeseriesEntry {
  bars: Bar[];
  fetchedAt: string;
}

interface TimeseriesState {
  byKey: Record<TimeseriesKey, TimeseriesEntry>;
  loadingByKey: Record<TimeseriesKey, boolean>;
  errorByKey: Record<TimeseriesKey, string | null>;
}

const initialState: TimeseriesState = {
  byKey: {},
  loadingByKey: {},
  errorByKey: {},
};

interface TimeseriesRequestedPayload {
  key: TimeseriesKey;
}

interface TimeseriesReceivedPayload {
  key: TimeseriesKey;
  bars: Bar[];
  // optional for backward-compatibility: we normalize to ISO in reducer
  fetchedAt?: string;
}

interface TimeseriesFailedPayload {
  key: TimeseriesKey;
  error: string;
}

interface TimeseriesCancelledPayload {
  key: TimeseriesKey;
}

const timeseriesSlice = createSlice({
  name: 'timeseries',
  initialState,
  reducers: {
    timeseriesRequested(
      state,
      action: PayloadAction<TimeseriesRequestedPayload>,
    ) {
      const { key } = action.payload;
      state.loadingByKey[key] = true;
      state.errorByKey[key] = null;
    },

    timeseriesReceived(
      state,
      action: PayloadAction<TimeseriesReceivedPayload>,
    ) {
      const { key, bars } = action.payload;
      // гарантируем единый формат времени в сторе
      const fetchedAt = new Date().toISOString();
      state.byKey[key] = { bars, fetchedAt };
      state.loadingByKey[key] = false;
      state.errorByKey[key] = null;
    },

    timeseriesFailed(state, action: PayloadAction<TimeseriesFailedPayload>) {
      const { key, error } = action.payload;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = error;
    },

    timeseriesCancelled(
      state,
      action: PayloadAction<TimeseriesCancelledPayload>,
    ) {
      const { key } = action.payload;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = null;
    },

    clearTimeseries(state, action: PayloadAction<TimeseriesKey>) {
      const key = action.payload;
      delete state.byKey[key];
      delete state.loadingByKey[key];
      delete state.errorByKey[key];
    },

    clearAllTimeseries() {
      return initialState;
    },
  },
});

export const {
  timeseriesRequested,
  timeseriesReceived,
  timeseriesFailed,
  timeseriesCancelled,
  clearTimeseries,
  clearAllTimeseries,
} = timeseriesSlice.actions;

export const timeseriesReducer = timeseriesSlice.reducer;

export const selectTimeseriesByKey = (state: RootState, key: TimeseriesKey) =>
  state.timeseries.byKey[key]?.bars ?? null;

export const selectTimeseriesFetchedAtByKey = (
  state: RootState,
  key: TimeseriesKey,
) => state.timeseries.byKey[key]?.fetchedAt ?? null;

/**
 * TTL helper на уровне слайса
 * Если нет данных или fetchedAt некорректен -считаем ряд устаревшим
 */
export const isTimeseriesStaleByKey = (
  state: RootState,
  key: TimeseriesKey,
  ttlMs: number,
  nowMs: number = Date.now(),
): boolean => {
  const fetchedAt = state.timeseries.byKey[key]?.fetchedAt;
  if (!fetchedAt) return true;

  const fetchedMs = Date.parse(fetchedAt);
  if (!Number.isFinite(fetchedMs)) return true;

  return nowMs - fetchedMs > ttlMs;
};

export const selectTimeseriesLoadingByKey = (
  state: RootState,
  key: TimeseriesKey,
) => state.timeseries.loadingByKey[key] ?? false;

export const selectTimeseriesErrorByKey = (
  state: RootState,
  key: TimeseriesKey,
) => state.timeseries.errorByKey[key] ?? null;
