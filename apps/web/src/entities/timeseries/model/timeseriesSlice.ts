import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/store';
import type { Bar } from '@shared/types/market';
import type { MarketDataProvider, MarketTimeframe } from '@/config/market';

export type TimeseriesKey = string;

export const buildTimeseriesKey = (
    provider: MarketDataProvider,
    symbol: string,
    timeframe: MarketTimeframe,
): TimeseriesKey => `${provider}:${symbol}:${timeframe}`;

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
  fetchedAt: string;
}

interface TimeseriesFailedPayload {
  key: TimeseriesKey;
  error: string;
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
      const { key, bars, fetchedAt } = action.payload;
      state.byKey[key] = { bars, fetchedAt };
      state.loadingByKey[key] = false;
      state.errorByKey[key] = null;
    },

    timeseriesFailed(state, action: PayloadAction<TimeseriesFailedPayload>) {
      const { key, error } = action.payload;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = error;
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
  clearTimeseries,
  clearAllTimeseries,
} = timeseriesSlice.actions;

export const timeseriesReducer = timeseriesSlice.reducer;


export const selectTimeseriesByKey = (state: RootState, key: TimeseriesKey) =>
    state.timeseries.byKey[key]?.bars ?? null;

export const selectTimeseriesLoadingByKey = (
    state: RootState,
    key: TimeseriesKey,
) => state.timeseries.loadingByKey[key] ?? false;

export const selectTimeseriesErrorByKey = (
    state: RootState,
    key: TimeseriesKey,
) => state.timeseries.errorByKey[key] ?? null;