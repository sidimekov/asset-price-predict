import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ForecastKey,
  ForecastEntry,
  ForecastState,
  ForecastParams,
} from '../types';

export type PredictRequest = {
  symbol: string;

  /**
   * UI-провайдер (например 'binance' | 'moex' | 'mock')
   * или уже нормализованный ('BINANCE' | 'MOEX' | 'MOCK').
   * Оркестратор сам нормализует это поле.
   */
  provider?: string;

  tf: string;
  window: number;
  horizon: number;
  model?: string | null;
};

type PredictState = {
  /** Монотонно растущий id - чтобы повторные клики Predict тоже отрабатывали */
  requestId: number;
  /** Последний запрос Predict */
  request: PredictRequest | null;
};

export type ForecastSliceState = ForecastState & {
  predict: PredictState;
};

const initialState: ForecastSliceState = {
  params: undefined,
  byKey: {},
  loadingByKey: {},
  errorByKey: {},
  predict: {
    requestId: 0,
    request: null,
  },
};

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    /**
     * Триггер Predict (manual forecast).
     * UI диспатчит predictRequested, оркестратор слушает requestId.
     */
    predictRequested(state, action: PayloadAction<PredictRequest>) {
      state.predict.requestId += 1;
      state.predict.request = action.payload;
    },

    /** сбросить последний Predict */
    predictCleared(state) {
      state.predict.request = null;
    },

    /** Начало расчёта/загрузки прогноза для ключа */
    forecastRequested(state, action: PayloadAction<ForecastKey>) {
      const key = action.payload;
      state.loadingByKey[key] = true;
      state.errorByKey[key] = null;
      // byKey не трогаем - старый прогноз остаётся, пока идёт новый
    },
    setForecastParams(state, action: PayloadAction<ForecastParams>) {
      state.params = action.payload;
    },

    /** Успешно получили прогноз */
    forecastReceived(
      state,
      action: PayloadAction<{ key: ForecastKey; entry: ForecastEntry }>,
    ) {
      const { key, entry } = action.payload;
      state.byKey[key] = entry;
      state.loadingByKey[key] = false;
      state.errorByKey[key] = null;
    },

    /** Ошибка при расчёте/загрузке прогноза */
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

    /** Очистить конкретный прогноз */
    clearForecast(state, action: PayloadAction<ForecastKey>) {
      const key = action.payload;
      delete state.byKey[key];
      delete state.loadingByKey[key];
      delete state.errorByKey[key];
    },

    /** Полностью очистить все прогнозы + predict */
    clearAllForecasts() {
      return initialState;
    },
  },
});

export const {
  predictRequested,
  predictCleared,
  forecastRequested,
  forecastReceived,
  forecastFailed,
  forecastCancelled,
  setForecastParams,
  clearForecast,
  clearAllForecasts,
} = forecastSlice.actions;

export const forecastReducer = forecastSlice.reducer;
