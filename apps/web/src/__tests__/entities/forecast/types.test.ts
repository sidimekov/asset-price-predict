import { describe, it, expect } from 'vitest';

import type {
  ForecastKey,
  ForecastPoint,
  ForecastSeries,
  BackendForecastSeries,
  ExplainRow,
  ForecastMeta,
  ForecastEntry,
  ForecastState,
} from '@/entities/forecast/types';

describe('forecast types smoke tests', () => {
  it('ForecastPoint and ForecastSeries allow correct tuples', () => {
    const p: ForecastPoint = [1234567890, 42];
    const series: ForecastSeries = [p, [1234567900, 43]];

    expect(series.length).toBe(2);
    expect(series[0][1]).toBe(42);
  });

  it('BackendForecastSeries validates numeric arrays', () => {
    const backend: BackendForecastSeries = {
      p10: [1, 2, 3],
      p50: [4, 5, 6],
      p90: [7, 8, 9],
      t: [100, 200, 300],
    };

    expect(backend.p50[1]).toBe(5);
    expect(backend.t.length).toBe(3);
  });

  it('ExplainRow structure works as expected', () => {
    const row: ExplainRow = {
      name: 'factor1',
      impact: 0.4,
      shap: 0.1,
      conf: 0.75,
    };

    expect(row.name).toBe('factor1');
    expect(row.impact).toBeCloseTo(0.4);
  });

  it('ForecastMeta matches expected shape', () => {
    const meta: ForecastMeta = {
      runtime_ms: 123,
      backend: 'local',
      model_ver: 'v1',
    };

    expect(meta.backend).toBe('local');
  });

  it('ForecastEntry supports optional P10/P90/explain', () => {
    const entry: ForecastEntry = {
      p50: [
        [1, 10],
        [2, 11],
      ],
      p10: [[1, 9]],
      meta: { runtime_ms: 5, backend: 'test', model_ver: 't' },
    };

    expect(entry.p50.length).toBe(2);
    expect(entry.meta.backend).toBe('test');
  });

  it('ForecastState maps keys to forecast entries', () => {
    const state: ForecastState = {
      params: { tf: '1h', window: 200, horizon: 24, model: null },
      byKey: {
        k: {
          p50: [[100, 1]],
          meta: { runtime_ms: 1, backend: 'local', model_ver: 'x' },
        },
      },
      loadingByKey: { k: true },
      errorByKey: { k: null },
    };

    expect(state.byKey.k.p50[0][1]).toBe(1);
  });
});
