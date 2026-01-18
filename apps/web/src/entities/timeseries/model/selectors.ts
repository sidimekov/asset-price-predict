import type { RootState } from '@/shared/store';
import type { Bar } from '@shared/types/market';
import type { MarketDataProvider, MarketTimeframe } from '@/config/market';
import {
  type TimeseriesKey,
  buildTimeseriesKey,
  isTimeseriesStaleByKey,
} from './timeseriesSlice';

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

export type PriceChangeSnapshot = {
  lastPrice?: number;
  changePct?: number;
};

export const selectPriceChangeByAsset = (
  state: RootState,
  provider: MarketDataProvider,
  symbol: string,
  timeframe: MarketTimeframe,
  limit: number,
): PriceChangeSnapshot => {
  const key = buildTimeseriesKey(provider, symbol, timeframe, limit);
  const bars = selectBarsByKey(state, key);
  if (!bars?.length) return {};

  const lastClose = bars[bars.length - 1]?.[4];
  const lastPrice = Number.isFinite(lastClose) ? lastClose : undefined;

  if (bars.length < 2 || lastPrice === undefined) {
    return { lastPrice };
  }

  const prevClose = bars[bars.length - 2]?.[4];
  if (!Number.isFinite(prevClose) || prevClose === 0) {
    return { lastPrice };
  }

  const changePct = ((lastPrice - prevClose) / prevClose) * 100;
  return { lastPrice, changePct };
};
