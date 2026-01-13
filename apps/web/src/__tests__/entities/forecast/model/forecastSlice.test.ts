import { describe, it, expect } from 'vitest';

import {
  forecastReducer,
  forecastRequested,
  forecastReceived,
  forecastFailed,
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
});
