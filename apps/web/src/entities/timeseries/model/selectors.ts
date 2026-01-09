import type { RootState } from '@/shared/store';
import type { Bar } from '@shared/types/market';
import { type TimeseriesKey, isTimeseriesStaleByKey } from './timeseriesSlice';

export const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 минут

export const selectTimeseriesState = (state: RootState) => state.timeseries;

export const selectBarsByKey = (
  state: RootState,
  key: TimeseriesKey,
): Bar[] | undefined => selectTimeseriesState(state).byKey[key]?.bars;

export const selectFetchedAtByKey = (
  state: RootState,
  key: TimeseriesKey,
): string | undefined => selectTimeseriesState(state).byKey[key]?.fetchedAt;

export const selectIsLoading = (
  state: RootState,
  key: TimeseriesKey,
): boolean => selectTimeseriesState(state).loadingByKey[key] ?? false;

export const selectError = (
  state: RootState,
  key: TimeseriesKey,
): string | null => selectTimeseriesState(state).errorByKey[key] ?? null;

/**
 * Хвост ряда под feature pipeline (последние N баров)
 * Если нет данных - undefined
 */
export const selectTailForFeatures = (
  state: RootState,
  key: TimeseriesKey,
  tailSize: number,
): Bar[] | undefined => {
  const bars = selectBarsByKey(state, key);
  if (!bars) return undefined;
  if (tailSize <= 0) return [];
  if (bars.length <= tailSize) return bars;
  return bars.slice(bars.length - tailSize);
};

/**
 * TTL staleness (по умолчанию 10 минут)
 * nowMs передаётся для тестов
 */
export const selectIsStale = (
  state: RootState,
  key: TimeseriesKey,
  ttlMs: number = DEFAULT_TTL_MS,
  nowMs: number = Date.now(),
): boolean => isTimeseriesStaleByKey(state, key, ttlMs, nowMs);
