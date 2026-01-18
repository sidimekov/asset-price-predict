import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ForecastKey,
  ForecastEntry,
  ForecastState,
  ForecastParams,
  ForecastPredictRequest,
} from '../types';

const initialState: ForecastState = {
  params: undefined,
  predict: { requestId: 0, request: null },
  byKey: {},
  loadingByKey: {},
  errorByKey: {},
};

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    forecastRequested(state, action: PayloadAction<ForecastKey>) {
      const key = action.payload;
      state.loadingByKey[key] = true;
      state.errorByKey[key] = null;
    },
    forecastPredictRequested(
      state,
      action: PayloadAction<ForecastPredictRequest>,
    ) {
      state.predict = {
        requestId: state.predict.requestId + 1,
        request: action.payload,
      };
    },
    setForecastParams(state, action: PayloadAction<ForecastParams>) {
      state.params = action.payload;
    },

    forecastReceived(
      state,
      action: PayloadAction<{ key: ForecastKey; entry: ForecastEntry }>,
    ) {
      const { key, entry } = action.payload;
      state.byKey[key] = entry;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = null;
    },

    forecastFailed(
      state,
      action: PayloadAction<{ key: ForecastKey; error: string }>,
    ) {
      const { key, error } = action.payload;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = error;
    },

    /**
     * Отмена расчёта: снимаем loading, не ставим error
     * Старый прогноз (если был) остаётся
     */
    forecastCancelled(state, action: PayloadAction<ForecastKey>) {
      const key = action.payload;
      state.loadingByKey[key] = false;
    },

    clearForecast(state, action: PayloadAction<ForecastKey>) {
      const key = action.payload;
      delete state.byKey[key];
      delete state.loadingByKey[key];
      delete state.errorByKey[key];
    },

    clearAllForecasts() {
      return initialState;
    },
  },
});

export const {
  forecastRequested,
  forecastPredictRequested,
  forecastReceived,
  forecastFailed,
  forecastCancelled,
  setForecastParams,
  clearForecast,
  clearAllForecasts,
} = forecastSlice.actions;

export const forecastReducer = forecastSlice.reducer;
