import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/store';
import type { Bar } from '@shared/types/market';
import type { MarketDataProvider, MarketTimeframe } from '@/config/market';

export type TimeseriesKey = string;

export const buildTimeseriesKey = (
    provider: MarketDataProvider,
    symbol: string,
    timeframe: MarketTimeframe,
): TimeseriesKey => `${provider}:${symbol}:${timeframe}`;

interface TimeseriesState {
  byKey: Record<TimeseriesKey, Bar[]>;
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
      const { key, bars } = action.payload;
      state.byKey[key] = bars;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = null;
    },
    timeseriesFailed(state, action: PayloadAction<TimeseriesFailedPayload>) {
      const { key, error } = action.payload;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = error;
    },
  },
});

export const { timeseriesRequested, timeseriesReceived, timeseriesFailed } =
    timeseriesSlice.actions;

export const timeseriesReducer = timeseriesSlice.reducer;

// selectors
export const selectTimeseriesByKey = (state: RootState, key: TimeseriesKey) =>
    state.timeseries.byKey[key] ?? null;

export const selectTimeseriesLoadingByKey = (
    state: RootState,
    key: TimeseriesKey,
) => state.timeseries.loadingByKey[key] ?? false;

export const selectTimeseriesErrorByKey = (
    state: RootState,
    key: TimeseriesKey,
) => state.timeseries.errorByKey[key] ?? null;