// когда будем мержить в мэин оставляем тест из marketAdapter
import { describe, it, expect } from 'vitest';

import {
  timeseriesReducer,
  timeseriesRequested,
  timeseriesReceived,
  timeseriesFailed,
  buildTimeseriesKey,
  selectTimeseriesByKey,
  selectTimeseriesLoadingByKey,
  selectTimeseriesErrorByKey,
  type TimeseriesKey,
} from '@/entities/timeseries/model/timeseriesSlice';
import type { RootState } from '@/shared/store';
import type { Bar } from '@shared/types/market';
import { DEFAULT_PROVIDER, DEFAULT_TIMEFRAME } from '@/config/market';

describe('timeseriesSlice', () => {
  const key: TimeseriesKey = buildTimeseriesKey(
    DEFAULT_PROVIDER,
    'BTCUSDT',
    DEFAULT_TIMEFRAME,
  );

  const sampleBars: Bar[] = [
    [1_000_000, 10, 11, 9, 10.5, 100],
    [1_000_600, 10.5, 11.5, 10, 11, 120],
  ];

  const makeRootState = (
    timeseriesState: ReturnType<typeof timeseriesReducer>,
  ) =>
    ({
      timeseries: timeseriesState,
    }) as unknown as RootState;

  it('buildTimeseriesKey формирует ключ из провайдера, символа и таймфрейма', () => {
    expect(key).toBe(`${DEFAULT_PROVIDER}:BTCUSDT:${DEFAULT_TIMEFRAME}`);
  });

  it('timeseriesRequested помечает ключ как загружающийся и очищает ошибку', () => {
    const initial = timeseriesReducer(undefined, { type: 'UNKNOWN' });

    const next = timeseriesReducer(initial, timeseriesRequested({ key }));

    expect(next.loadingByKey[key]).toBe(true);
    expect(next.errorByKey[key]).toBeNull();
  });

  it('timeseriesReceived сохраняет бары и сбрасывает флаги загрузки/ошибок', () => {
    const requestedState = timeseriesReducer(
      undefined,
      timeseriesRequested({ key }),
    );

    const next = timeseriesReducer(
      requestedState,
      timeseriesReceived({ key, bars: sampleBars }),
    );

    expect(next.byKey[key]).toEqual(sampleBars);
    expect(next.loadingByKey[key]).toBe(false);
    expect(next.errorByKey[key]).toBeNull();
  });

  it('timeseriesFailed сохраняет ошибку и снимает флаг загрузки', () => {
    const requestedState = timeseriesReducer(
      undefined,
      timeseriesRequested({ key }),
    );

    const error = 'NETWORK_ERROR';

    const next = timeseriesReducer(
      requestedState,
      timeseriesFailed({ key, error }),
    );

    expect(next.loadingByKey[key]).toBe(false);
    expect(next.errorByKey[key]).toBe(error);
  });

  it('селекторы корректно читают данные по ключу', () => {
    const stateAfterSuccess = timeseriesReducer(
      undefined,
      timeseriesReceived({ key, bars: sampleBars }),
    );

    const root = makeRootState(stateAfterSuccess);

    expect(selectTimeseriesByKey(root, key)).toEqual(sampleBars);
    expect(selectTimeseriesLoadingByKey(root, key)).toBe(false);
    expect(selectTimeseriesErrorByKey(root, key)).toBeNull();
  });

  it('селекторы возвращают значения по умолчанию для неизвестного ключа', () => {
    const initial = timeseriesReducer(undefined, { type: 'UNKNOWN' });
    const root = makeRootState(initial);

    expect(selectTimeseriesByKey(root, 'UNKNOWN:key')).toBeNull();
    expect(selectTimeseriesLoadingByKey(root, 'UNKNOWN:key')).toBe(false);
    expect(selectTimeseriesErrorByKey(root, 'UNKNOWN:key')).toBeNull();
  });
});
