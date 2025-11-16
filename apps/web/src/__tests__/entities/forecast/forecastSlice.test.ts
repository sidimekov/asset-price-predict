import {
  forecastReducer,
  setForecastParams,
  setForecastSeries,
  setForecastExplain,
  setForecastMeta,
  resetForecast,
  selectForecastSeries,
  type ForecastState,
  type ForecastExplainItem,
} from '@/entities/forecast/model/forecastSlice';
import { describe, it, expect } from 'vitest';

describe('forecastSlice', () => {
  const initialState: ForecastState = forecastReducer(undefined, {
    type: '@@INIT',
  } as any);

  it('должен возвращать initialState по умолчанию', () => {
    expect(initialState.params.symbol).toBe('BTCUSDT');
    expect(initialState.series.p50).toEqual([]);
    expect(initialState.explain).toEqual([]);
    expect(initialState.meta).toBeNull();
  });

  it('setForecastParams должен мержить параметры', () => {
    const next = forecastReducer(
      initialState,
      setForecastParams({ timeframe: '8h', horizon: 48 }),
    );

    expect(next.params.symbol).toBe(initialState.params.symbol);
    expect(next.params.timeframe).toBe('8h');
    expect(next.params.horizon).toBe(48);
  });

  it('setForecastSeries должен сохранять p10/p50/p90 и подставлять пустые массивы', () => {
    const series = {
      p50: [
        [1, 10],
        [2, 12],
      ] as Array<[number, number]>,
      p10: undefined,
      p90: [
        [1, 20],
        [2, 22],
      ] as Array<[number, number]>,
    };

    const next = forecastReducer(initialState, setForecastSeries(series));

    expect(next.series.p50).toHaveLength(2);
    expect(next.series.p10).toEqual([]);
    expect(next.series.p90).toHaveLength(2);
  });

  it('setForecastExplain должен сохранять факторы', () => {
    const explain: ForecastExplainItem[] = [
      { name: 'trend', group: 'trend', impact_abs: 0.5, sign: '+' },
    ];

    const next = forecastReducer(initialState, setForecastExplain(explain));
    expect(next.explain).toEqual(explain);
  });

  it('setForecastMeta должен сохранять meta и resetForecast очищать series/explain/meta', () => {
    const meta = { runtime_ms: 123, backend: 'local' as const };

    const withMeta = forecastReducer(initialState, setForecastMeta(meta));
    expect(withMeta.meta).toEqual(meta);

    const reset = forecastReducer(withMeta, resetForecast());
    expect(reset.series.p50).toEqual([]);
    expect(reset.series.p10).toEqual([]);
    expect(reset.series.p90).toEqual([]);
    expect(reset.explain).toEqual([]);
    expect(reset.meta).toBeNull();
  });

  it('selectForecastSeries должен объединять p10/p50/p90 по ts и сортировать', () => {
    const state = {
      forecast: {
        ...initialState,
        series: {
          p50: [
            [3, 30],
            [1, 10],
          ],
          p10: [[1, 5]],
          p90: [[3, 35]],
        },
      },
    } as any;

    const result = selectForecastSeries(state);

    expect(result).toHaveLength(2);
    // сортировка по ts
    expect(result[0].ts).toBe(1);
    expect(result[1].ts).toBe(3);

    const first = result[0];
    expect(first.p10).toBe(5);
    expect(first.p50).toBe(10);
    expect(first.p90).toBeUndefined();

    const second = result[1];
    expect(second.p50).toBe(30);
    expect(second.p90).toBe(35);
  });
});
