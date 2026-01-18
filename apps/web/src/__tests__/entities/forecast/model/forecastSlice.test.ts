import { describe, it, expect } from 'vitest';

import {
  forecastReducer,
  forecastRequested,
  forecastReceived,
  forecastFailed,
  setForecastParams,
  forecastCancelled,
  forecastPredictRequested,
  clearForecast,
  clearAllForecasts,
} from '@/entities/forecast/model/forecastSlice';
import type { ForecastState, ForecastEntry } from '@/entities/forecast/types';

const initialState: ForecastState = {
  params: undefined,
  predict: { requestId: 0, request: null },
  byKey: {},
  loadingByKey: {},
  errorByKey: {},
};

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
    const state = forecastReducer(initialState, forecastRequested('k'));

    expect(state.loadingByKey['k']).toBe(true);
    expect(state.errorByKey['k']).toBeNull();
    expect(state.byKey['k']).toBeUndefined();
  });

  it('forecastReceived кладёт entry и сбрасывает loading/error', () => {
    const state = forecastReducer(
      initialState,
      forecastReceived({ key: 'k', entry: sampleEntry }),
    );

    expect(state.byKey['k']).toEqual(sampleEntry);
    expect(state.loadingByKey['k']).toBe(false);
    expect(state.errorByKey['k']).toBeNull();
  });

  it('forecastFailed выставляет error и снимает loading', () => {
    const stateAfterRequest = forecastReducer(
      initialState,
      forecastRequested('k'),
    );

    const state = forecastReducer(
      stateAfterRequest,
      forecastFailed({ key: 'k', error: 'boom' }),
    );

    expect(state.loadingByKey['k']).toBe(false);
    expect(state.errorByKey['k']).toBe('boom');
  });

  it('clearForecast удаляет конкретный ключ', () => {
    const filled: ForecastState = {
      params: undefined,
      predict: { requestId: 0, request: null },
      byKey: { k: sampleEntry },
      loadingByKey: { k: false },
      errorByKey: { k: null },
    };

    const state = forecastReducer(filled, clearForecast('k'));

    expect(state.byKey['k']).toBeUndefined();
    expect(state.loadingByKey['k']).toBeUndefined();
    expect(state.errorByKey['k']).toBeUndefined();
  });

  it('clearAllForecasts сбрасывает стейт к initialState', () => {
    const filled: ForecastState = {
      params: undefined,
      predict: { requestId: 0, request: null },
      byKey: { k: sampleEntry },
      loadingByKey: { k: false },
      errorByKey: { k: null },
    };

    const state = forecastReducer(filled, clearAllForecasts());

    expect(state).toEqual(initialState);
  });

  it('setForecastParams сохраняет параметры прогноза', () => {
    const params = { tf: '1h', window: 200, horizon: 24, model: null };
    const state = forecastReducer(initialState, setForecastParams(params));

    expect(state.params).toEqual(params);
  });

  it('forecastPredictRequested увеличивает requestId и сохраняет запрос', () => {
    const state = forecastReducer(
      initialState,
      forecastPredictRequested({
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

  it('forecastCancelled снимает loading без изменения ошибки', () => {
    const requested = forecastReducer(initialState, forecastRequested('k'));
    const failed = forecastReducer(
      requested,
      forecastFailed({ key: 'k', error: 'boom' }),
    );

    const state = forecastReducer(failed, forecastCancelled('k'));

    expect(state.loadingByKey['k']).toBe(false);
    expect(state.errorByKey['k']).toBe('boom');
  });
});
