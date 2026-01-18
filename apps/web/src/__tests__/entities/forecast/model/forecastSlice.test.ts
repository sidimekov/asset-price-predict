import { describe, it, expect } from 'vitest';

import {
  forecastReducer,
  forecastRequested,
  forecastReceived,
  forecastFailed,
  forecastCancelled,
  predictRequested,
  predictCleared,
  clearForecast,
  clearAllForecasts,
} from '@/entities/forecast/model/forecastSlice';
import type { ForecastEntry } from '@/entities/forecast/types';

const getInitial = () =>
  forecastReducer(undefined as any, { type: '@@INIT' } as any);

const sampleEntry: ForecastEntry = {
  p50: [
    [1, 10],
    [2, 11],
  ],
  meta: {
    runtime_ms: 123,
    backend: 'local',
    model_ver: 'test-model',
  },
};

describe('forecastSlice', () => {
  it('forecastRequested выставляет loading и сбрасывает error', () => {
    const initial = getInitial();
    const state = forecastReducer(initial, forecastRequested('k'));

    expect(state.loadingByKey['k']).toBe(true);
    expect(state.errorByKey['k']).toBeNull();
    // byKey не трогаем
  });

  it('forecastReceived кладёт entry и сбрасывает loading/error', () => {
    const initial = getInitial();
    const state = forecastReducer(
      initial,
      forecastReceived({ key: 'k', entry: sampleEntry }),
    );

    expect(state.byKey['k']).toEqual(sampleEntry);
    expect(state.loadingByKey['k']).toBe(false);
    expect(state.errorByKey['k']).toBeNull();
  });

  it('forecastFailed выставляет error и снимает loading', () => {
    const initial = getInitial();
    const stateAfterRequest = forecastReducer(initial, forecastRequested('k'));

    const state = forecastReducer(
      stateAfterRequest,
      forecastFailed({ key: 'k', error: 'boom' }),
    );

    expect(state.loadingByKey['k']).toBe(false);
    expect(state.errorByKey['k']).toBe('boom');
  });

  it('clearForecast удаляет конкретный ключ', () => {
    const initial = getInitial();

    const filled = forecastReducer(
      initial,
      forecastReceived({ key: 'k', entry: sampleEntry }),
    );

    const state = forecastReducer(filled, clearForecast('k'));

    expect(state.byKey['k']).toBeUndefined();
    expect(state.loadingByKey['k']).toBeUndefined();
    expect(state.errorByKey['k']).toBeUndefined();
  });

  it('clearAllForecasts сбрасывает стейт к initial', () => {
    const initial = getInitial();

    const filled = forecastReducer(
      initial,
      forecastReceived({ key: 'k', entry: sampleEntry }),
    );

    const state = forecastReducer(filled, clearAllForecasts());

    expect(state).toEqual(getInitial());
  });
  it('forecastRequested не затирает существующий прогноз по ключу', () => {
    const initial = getInitial();

    const withEntry = forecastReducer(
      initial,
      forecastReceived({ key: 'k', entry: sampleEntry }),
    );

    const state = forecastReducer(withEntry, forecastRequested('k'));

    expect(state.byKey['k']).toEqual(sampleEntry); // не потерять старый прогноз
    expect(state.loadingByKey['k']).toBe(true);
    expect(state.errorByKey['k']).toBeNull();
  });

  it('clearForecast на отсутствующем ключе не ломает стейт', () => {
    const initial = getInitial();
    const state = forecastReducer(initial, clearForecast('missing'));

    // должно остаться как было
    expect(state).toEqual(initial);
  });

  it('predictRequested увеличивает requestId и сохраняет запрос', () => {
    const initial = getInitial();

    const state = forecastReducer(
      initial,
      predictRequested({
        symbol: 'SBER',
        provider: 'binance',
        tf: '1h',
        window: 200,
        horizon: 24,
        model: null,
      }),
    );

    expect(state.predict.requestId).toBe(1);
    expect(state.predict.request).toEqual({
      symbol: 'SBER',
      provider: 'binance',
      tf: '1h',
      window: 200,
      horizon: 24,
      model: null,
    });
  });

  it('predictCleared сбрасывает запрос, но не меняет requestId', () => {
    const initial = getInitial();

    const withRequest = forecastReducer(
      initial,
      predictRequested({
        symbol: 'SBER',
        provider: 'binance',
        tf: '1h',
        window: 200,
        horizon: 24,
        model: null,
      }),
    );

    const state = forecastReducer(withRequest, predictCleared());

    expect(state.predict.requestId).toBe(1);
    expect(state.predict.request).toBeNull();
  });

  it('forecastCancelled снимает loading без изменения ошибки', () => {
    const initial = getInitial();
    const requested = forecastReducer(initial, forecastRequested('k'));
    const failed = forecastReducer(
      requested,
      forecastFailed({ key: 'k', error: 'boom' }),
    );

    const state = forecastReducer(failed, forecastCancelled('k'));

    expect(state.loadingByKey['k']).toBe(false);
    expect(state.errorByKey['k']).toBe('boom');
  });
});
