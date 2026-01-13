import type { RootState } from '@/shared/store';
import type {
  ForecastKey,
  ForecastEntry,
  ForecastSeries,
  ExplainRow,
  ForecastMeta,
  ForecastParams,
} from '../types';

// Базовый селектор среза
export const selectForecastState = (state: RootState) => state.forecast;

//  Селекторы по ТЗ :

export const selectForecastByKey = (
  state: RootState,
  key: ForecastKey,
): ForecastEntry | undefined => state.forecast.byKey[key];

export const selectForecastLoading = (
  state: RootState,
  key: ForecastKey,
): boolean => state.forecast.loadingByKey[key] ?? false;

export const selectForecastError = (
  state: RootState,
  key: ForecastKey,
): string | null => state.forecast.errorByKey[key] ?? null;

/**
 * Параметры прогноза для оркестратора
 * если params нет в типах ForecastState, читаем через any
 */
export const selectForecastParams = (
  state: RootState,
): ForecastParams | undefined => state.forecast.params;

/**
 * селектор для графика: сразу отдаёт только ряды
 */
export const selectForecastSeries = (
  state: RootState,
  key: ForecastKey,
): { p50: ForecastSeries; p10?: ForecastSeries; p90?: ForecastSeries } => {
  const entry = state.forecast.byKey[key];
  if (!entry) {
    return { p50: [], p10: undefined, p90: undefined };
  }
  const { p50, p10, p90 } = entry;
  return { p50, p10, p90 };
};

export const selectForecastExplain = (
  state: RootState,
  key: ForecastKey,
): ExplainRow[] | undefined => state.forecast.byKey[key]?.explain;

export const selectForecastMeta = (
  state: RootState,
  key: ForecastKey,
): ForecastMeta | undefined => state.forecast.byKey[key]?.meta;
