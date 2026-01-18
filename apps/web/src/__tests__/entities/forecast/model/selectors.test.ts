import { describe, it, expect } from 'vitest';

import {
  selectForecastState,
  selectForecastByKey,
  selectForecastLoading,
  selectForecastError,
  selectForecastSeries,
  selectForecastExplain,
  selectForecastMeta,
} from '@/entities/forecast/model/selectors';
import type { ForecastState, ForecastEntry } from '@/entities/forecast/types';

const sampleEntry: ForecastEntry = {
  p50: [
    [1, 10],
    [2, 11],
  ],
  p10: [[1, 9]],
  p90: [[1, 12]],
  explain: [
    { name: 'factor1', impact: 0.5 },
    { name: 'factor2', impact: -0.2 },
  ],
  meta: {
    runtime_ms: 100,
    backend: 'local',
    model_ver: 'test-model',
  },
};

const stateWithOne: ForecastState = {
  params: undefined,
  byKey: { key1: sampleEntry },
  loadingByKey: { key1: true },
  errorByKey: { key1: 'oops' },
};

// заглушка RootState: в тестах нам важен только срез forecast
const makeRootState = (forecast: ForecastState) =>
  ({
    forecast,
  }) as any;

describe('forecast selectors', () => {
  it('selectForecastState возвращает весь срез', () => {
    const root = makeRootState(stateWithOne);
    expect(selectForecastState(root)).toBe(stateWithOne);
  });

  it('selectForecastByKey возвращает ForecastEntry по ключу', () => {
    const root = makeRootState(stateWithOne);

    expect(selectForecastByKey(root, 'key1')).toEqual(sampleEntry);
    expect(selectForecastByKey(root, 'unknown')).toBeUndefined();
  });

  it('selectForecastLoading возвращает true/false, по умолчанию false', () => {
    const root = makeRootState(stateWithOne);

    expect(selectForecastLoading(root, 'key1')).toBe(true);
    expect(selectForecastLoading(root, 'unknown')).toBe(false);
  });

  it('selectForecastError возвращает строку ошибки или null', () => {
    const root = makeRootState(stateWithOne);

    expect(selectForecastError(root, 'key1')).toBe('oops');
    expect(selectForecastError(root, 'unknown')).toBeNull();
  });

  it('selectForecastSeries отдаёт p50/p10/p90, даже если записи нет', () => {
    const root = makeRootState(stateWithOne);

    const s1 = selectForecastSeries(root, 'key1');
    expect(s1.p50).toEqual(sampleEntry.p50);
    expect(s1.p10).toEqual(sampleEntry.p10);
    expect(s1.p90).toEqual(sampleEntry.p90);

    const s2 = selectForecastSeries(root, 'unknown');
    expect(s2.p50).toEqual([]);
    expect(s2.p10).toBeUndefined();
    expect(s2.p90).toBeUndefined();
  });

  it('selectForecastExplain и selectForecastMeta корректно достают поля', () => {
    const root = makeRootState(stateWithOne);

    expect(selectForecastExplain(root, 'key1')).toEqual(sampleEntry.explain);
    expect(selectForecastMeta(root, 'key1')).toEqual(sampleEntry.meta);

    expect(selectForecastExplain(root, 'unknown')).toBeUndefined();
    expect(selectForecastMeta(root, 'unknown')).toBeUndefined();
  });
});
