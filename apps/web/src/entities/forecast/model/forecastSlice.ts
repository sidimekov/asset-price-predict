import {
  createSlice,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { RootState } from '@/shared/store';
import type { Symbol, Timeframe } from '@shared/types/market';

/** Одна точка прогноза, уже объединённая по ts */
export type ForecastPoint = {
  ts: number;
  p10?: number;
  p50?: number;
  p90?: number;
};

export type ForecastExplainItem = {
  name: string;
  group: string;
  impact_abs: number;
  sign: '+' | '-';
  shap?: number;
  confidence?: number;
};

export type ForecastMeta = {
  runtime_ms: number;
  backend: string;
};

export type ForecastParams = {
  symbol: Symbol;
  timeframe: Timeframe;
  horizon: number;
  model?: string;
};

type SeriesRaw = {
  p50: Array<[number, number]>;
  p10?: Array<[number, number]>;
  p90?: Array<[number, number]>;
};

export type ForecastState = {
  params: ForecastParams;
  series: SeriesRaw;
  explain: ForecastExplainItem[];
  meta: ForecastMeta | null;
};

const initialState: ForecastState = {
  params: {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    horizon: 24,
    model: undefined,
  },
  series: {
    p50: [],
    p10: [],
    p90: [],
  },
  explain: [],
  meta: null,
};

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    /** Меняем параметры прогноза (timeframe/horizon/model/… ) */
    setForecastParams(state, action: PayloadAction<Partial<ForecastParams>>) {
      state.params = { ...state.params, ...action.payload };
    },

    /** Сохраняем ряды p10/p50/p90 (уже в формате [ts, value]) */
    setForecastSeries(state, action: PayloadAction<SeriesRaw>) {
      state.series = {
        p50: action.payload.p50 ?? [],
        p10: action.payload.p10 ?? [],
        p90: action.payload.p90 ?? [],
      };
    },

    /** Факторы explain */
    setForecastExplain(state, action: PayloadAction<ForecastExplainItem[]>) {
      state.explain = action.payload;
    },

    setForecastMeta(state, action: PayloadAction<ForecastMeta | null>) {
      state.meta = action.payload;
    },

    resetForecast(state) {
      state.series = { p50: [], p10: [], p90: [] };
      state.explain = [];
      state.meta = null;
    },
  },
});

export const {
  setForecastParams,
  setForecastSeries,
  setForecastExplain,
  setForecastMeta,
  resetForecast,
} = forecastSlice.actions;

export const forecastReducer = forecastSlice.reducer;

/* ---------- SELECTORS ---------- */

const selectForecastRoot = (state: RootState) => state.forecast;

export const selectForecastParams = (state: RootState) =>
  selectForecastRoot(state).params;

export const selectForecastExplain = (state: RootState) =>
  selectForecastRoot(state).explain;

export const selectForecastMeta = (state: RootState) =>
  selectForecastRoot(state).meta;

const selectForecastSeriesRaw = (state: RootState) =>
  selectForecastRoot(state).series;

/** Объединяем p10/p50/p90 в массив точек для графика */
export const selectForecastSeries = createSelector(
  [selectForecastSeriesRaw],
  (series): ForecastPoint[] => {
    const map = new Map<number, ForecastPoint>();

    const add = (
      arr: Array<[number, number]> | undefined,
      key: 'p10' | 'p50' | 'p90',
    ) => {
      if (!arr) return;
      for (const [ts, value] of arr) {
        const existing = map.get(ts) ?? { ts };
        (existing as any)[key] = value;
        map.set(ts, existing);
      }
    };

    add(series.p50, 'p50');
    add(series.p10, 'p10');
    add(series.p90, 'p90');

    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  },
);
