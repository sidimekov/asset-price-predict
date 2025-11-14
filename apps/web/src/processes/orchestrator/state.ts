import type { RootState } from '@/shared/store';
import type { Bar } from '@assetpredict/shared';

export type OrchestratorStatus = 'idle' | 'running' | 'error'

export const TIMESERIES_TTL_MS = 10 * 60 * 1000; // 10 минут

export const orchestratorState: { status: OrchestratorStatus } = {
  status: 'idle',
};

// временный локальный кэш ts, пока нет timeseriesSlice из pr market adapter
const localTimeseriesCache = new Map<string, { bars: Bar[]; fetchedAt: number }>();

export function getLocalTimeseries(key: string) {
  return localTimeseriesCache.get(key);
}

export function setLocalTimeseries(key: string, bars: Bar[]) {
  localTimeseriesCache.set(key, { bars, fetchedAt: Date.now() });
}

export function isLocalTimeseriesStale(key: string, ttlMs = TIMESERIES_TTL_MS): boolean {
  const entry = localTimeseriesCache.get(key);
  if (!entry) return true;
  return Date.now() - entry.fetchedAt > ttlMs;
}

/**
 * Выбранный актив из catalogSlice
 * state.catalog.selected = { symbol: string; provider: string }
 */
export const selectSelectedAsset = (state: RootState) =>
  (state as any).catalog?.selected as
    | { symbol: string; provider: string }
    | undefined;

/**
 * Параметры прогноза из forecastSlice
 * совпадает с ForecastCreateReq, но добавлен window
 * state.forecast.params = { tf, window, horizon, model? }
 */
export const selectForecastParams = (state: RootState) =>
  (state as any).forecast?.params as
    | { tf: string; window: string | number; horizon: number; model?: string | null }
    | undefined;

/**
 * Вход ts по ключу из timeseriesSlice
 * Ожидаемый shape (соответствует ТЗ Timeseries Store, не shared):
 * state.timeseries.byKey[key] = { bars: Bar[]; fetchedAt: string }
 */
export const selectTimeseriesEntry = (state: RootState, key: string) =>
  ((state as any).timeseries?.byKey?.[key] ??
    undefined) as
    | {
    bars: Bar[]
    fetchedAt: string
  }
    | undefined;

export const selectIsTimeseriesLoading = (state: RootState, key: string): boolean =>
  Boolean((state as any).timeseries?.loadingByKey?.[key]);

export const selectTimeseriesError = (state: RootState, key: string): string | null =>
  ((state as any).timeseries?.errorByKey?.[key] ?? null) as string | null;

export const selectIsTimeseriesStale = (
  state: RootState,
  key: string,
  ttlMs = TIMESERIES_TTL_MS,
): boolean => {
  const entry = selectTimeseriesEntry(state, key);
  if (!entry) return true;
  const fetchedAtMs = new Date(entry.fetchedAt).getTime();
  if (Number.isNaN(fetchedAtMs)) return true;
  return Date.now() - fetchedAtMs > ttlMs;
};


// TODO, когда появится timeseriesSlice:
//  - удалить localTimeseriesCache и функции его
//  - заменить на селекторы timeseriesSlice