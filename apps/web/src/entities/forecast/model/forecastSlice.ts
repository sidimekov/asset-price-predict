import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ForecastKey, ForecastEntry, ForecastState } from '../types';

const initialState: ForecastState = {
  byKey: {},
  loadingByKey: {},
  errorByKey: {},
};

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    /**
     * Начало загрузки/расчёта прогноза для ключа
     * вызываем как: dispatch(forecastRequested(key))
     */
    forecastRequested(state, action: PayloadAction<ForecastKey>) {
      const key = action.payload;
      state.loadingByKey[key] = true;
      state.errorByKey[key] = null;
      // byKey не трогаем — старый прогноз остаётся, пока идёт новый
    },

    /**
     * Успешно получили прогноз
     * dispatch(forecastReceived({ key, entry }))
     */
    forecastReceived(
      state,
      action: PayloadAction<{ key: ForecastKey; entry: ForecastEntry }>,
    ) {
      const { key, entry } = action.payload;
      state.byKey[key] = entry;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = null;
    },

    /**
     * Ошибка при расчёте/загрузке прогноза
     * dispatch(forecastFailed({ key, error }))
     */
    forecastFailed(
      state,
      action: PayloadAction<{ key: ForecastKey; error: string }>,
    ) {
      const { key, error } = action.payload;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = error;
    },

    /**
     * Очистить конкретный прогноз
     * dispatch(clearForecast(key))
     */
    clearForecast(state, action: PayloadAction<ForecastKey>) {
      const key = action.payload;
      delete state.byKey[key];
      delete state.loadingByKey[key];
      delete state.errorByKey[key];
    },

    /**
     * Полностью очистить все прогнозы
     * dispatch(clearAllForecasts())
     */
    clearAllForecasts() {
      return initialState;
    },
  },
});

export const {
  forecastRequested,
  forecastReceived,
  forecastFailed,
  clearForecast,
  clearAllForecasts,
} = forecastSlice.actions;

export const forecastReducer = forecastSlice.reducer;
