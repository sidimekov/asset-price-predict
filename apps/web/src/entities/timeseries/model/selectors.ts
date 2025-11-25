import type { RootState } from '@/shared/store';
import type { Bar } from '@shared/types/market';
import type { TimeseriesKey } from './timeseriesSlice';

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 минут

export const selectTimeseriesState = (state: RootState) => state.timeseries;

export const selectBarsByKey = (
  state: RootState,
  key: TimeseriesKey,
): Bar[] | undefined => selectTimeseriesState(state).byKey[key]?.bars;

export const selectIsLoading = (
  state: RootState,
  key: TimeseriesKey,
): boolean => !!selectTimeseriesState(state).loadingByKey[key];

export const selectError = (
  state: RootState,
  key: TimeseriesKey,
): string | null => selectTimeseriesState(state).errorByKey[key] ?? null;

export type TailPoint = [ts: number, close: number];

export const selectTailForFeatures = (
  state: RootState,
  params: { key: TimeseriesKey; n: number },
): TailPoint[] => {
  const { key, n } = params;
  if (n <= 0) return [];

  const entry = selectTimeseriesState(state).byKey[key];
  if (!entry?.bars?.length) return [];

  const tail = entry.bars.slice(-n);
  return tail.map(([ts, _o, _h, _l, c]) => [ts, c]);
};

export const selectIsStale = (
  state: RootState,
  key: TimeseriesKey,
  ttlMs: number = DEFAULT_TTL_MS,
): boolean => {
  const entry = selectTimeseriesState(state).byKey[key];
  if (!entry) return true;

  const fetchedAtTs = Date.parse(entry.fetchedAt);
  if (Number.isNaN(fetchedAtTs)) return true;

  const age = Date.now() - fetchedAtTs;
  return age > ttlMs;
};

export { DEFAULT_TTL_MS };
