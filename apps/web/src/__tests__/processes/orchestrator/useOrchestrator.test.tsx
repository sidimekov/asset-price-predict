import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, act } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';

// 1) Мокаем селекторы, которые useOrchestrator импортирует напрямую
vi.mock('@/features/asset-catalog/model/catalogSlice', async () => {
  return {
    selectSelectedAsset: (state: any) => state.catalog?.selected,
  };
});

vi.mock('@/entities/forecast/model/selectors', async () => {
  return {
    selectForecastParams: (state: any) => state.forecast?.params,
  };
});

// 2) Мокаем ForecastManager (split API)
vi.mock('@/processes/orchestrator/ForecastManager', () => ({
  ForecastManager: {
    ensureTimeseriesOnly: vi.fn().mockResolvedValue(undefined),
    runForecast: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue(undefined), // безопасно, если где-то ещё используется
  },
}));

import { ForecastManager } from '@/processes/orchestrator/ForecastManager';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';

type Selected = { symbol: string; provider: string } | undefined;
type Params =
  | { tf: string; window: number | string; horizon: number; model?: any }
  | undefined;

const catalogReducer = (
  state = { selected: undefined as Selected },
  action: any,
) => {
  switch (action.type) {
    case 'SET_SELECTED':
      return { ...state, selected: action.payload };
    default:
      return state;
  }
};

const forecastReducer = (
  state = {
    params: undefined as Params,
    predict: { requestId: 0, request: null as any },
  },
  action: any,
) => {
  switch (action.type) {
    case 'SET_PARAMS':
      return { ...state, params: action.payload };
    case 'PREDICT':
      return {
        ...state,
        predict: {
          requestId: state.predict.requestId + 1,
          request: action.payload,
        },
      };
    case 'PREDICT_EMPTY':
      return {
        ...state,
        predict: { requestId: state.predict.requestId + 1, request: null },
      };
    default:
      return state;
  }
};

const TestComponent: React.FC = () => {
  useOrchestrator();

  // гарантируем подписку на стор (чтобы эффекты точно реагировали на dispatch)
  useSelector((s: any) => s.catalog.selected);
  useSelector((s: any) => s.forecast.params);
  useSelector((s: any) => s.forecast.predict.requestId);

  return <div />;
};

describe('useOrchestrator (split timeseries/forecast)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createTestStore = () =>
    configureStore({
      reducer: {
        catalog: catalogReducer,
        forecast: forecastReducer,
      },
    });

  it('does nothing when selected is missing (even if params exist)', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    const runForecastMock = (ForecastManager as any).runForecast as Mock;

    expect(ensureMock).not.toHaveBeenCalled();
    expect(runForecastMock).not.toHaveBeenCalled();
  });

  it('calls ensureTimeseriesOnly once when selected and params are set (auto history)', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(300); // debounce 250
    });

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    const runForecastMock = (ForecastManager as any).runForecast as Mock;

    expect(ensureMock).toHaveBeenCalledTimes(1);
    expect(runForecastMock).not.toHaveBeenCalled();

    const [ctxArg, depsArg] = ensureMock.mock.calls[0];

    expect(ctxArg).toMatchObject({
      symbol: 'SBER',
      provider: 'MOCK', // DEV override в non-prod
      tf: '1h',
      window: 200,
    });

    expect(depsArg).toHaveProperty('dispatch');
    expect(depsArg).toHaveProperty('getState');
    expect(depsArg).toHaveProperty('signal');
  });

  it('does not rerun ensureTimeseriesOnly for the same signature', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).toHaveBeenCalledTimes(1);

    // те же значения -> не должно быть второго вызова
    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(ensureMock).toHaveBeenCalledTimes(1);
  });

  it('calls runForecast when Predict trigger fires (requestId changes)', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    // даём авто timeseries отработать
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // чтобы ожидания были стабильные — чистим вызовы перед predict
    // чтобы ожидания были стабильные — чистим вызовы перед predict
    vi.clearAllMocks();

    // 1) диспатчим PREDICT (без прокрутки таймеров)
    await act(async () => {
      store.dispatch({
        type: 'PREDICT',
        payload: {
          symbol: 'SBER',
          provider: 'binance',
          tf: '1h',
          window: 200,
          horizon: 24,
          model: null,
        },
      });
    });

    // 2) даём React применить effect, который поставит setTimeout
    await act(async () => {
      await Promise.resolve();
    });

    // 3) теперь исполняем debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const runForecastMock = (ForecastManager as any).runForecast as Mock;
    expect(runForecastMock).toHaveBeenCalledTimes(1);

    const [ctxArg, depsArg] = runForecastMock.mock.calls[0];

    expect(ctxArg).toMatchObject({
      symbol: 'SBER',
      provider: 'MOCK', // DEV override
      tf: '1h',
      window: 200,
      horizon: 24,
    });

    expect(depsArg).toHaveProperty('dispatch');
    expect(depsArg).toHaveProperty('getState');
    expect(depsArg).toHaveProperty('signal');
  });

  it('skips when window is invalid (<=0 or NaN)', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });

    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 0, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      store.dispatch({
        type: 'PREDICT',
        payload: {
          symbol: 'SBER',
          provider: 'binance',
          tf: '1h',
          window: 0, // <-- ВАЖНО: invalid
          horizon: 24,
          model: null,
        },
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    const runForecastMock = (ForecastManager as any).runForecast as Mock;

    expect(ensureMock).not.toHaveBeenCalled();
    expect(runForecastMock).not.toHaveBeenCalled();
  });
  it('uses DEV default params when params are missing (non-production)', async () => {
    const store = createTestStore();

    // params НЕ задаём
    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).toHaveBeenCalledTimes(1);

    const [ctxArg] = ensureMock.mock.calls[0];
    expect(ctxArg).toMatchObject({
      symbol: 'SBER',
      provider: 'MOCK', // dev override
      tf: '1h', // default
      window: 200, // default
    });
  });

  it('parses window when it is a string (timeseries)', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });

    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: '200', horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).toHaveBeenCalledTimes(1);

    const [ctxArg] = ensureMock.mock.calls[0];
    expect(ctxArg.window).toBe(200);
  });

  it('in production maps provider=binance -> BINANCE for timeseries', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const store = createTestStore();

      store.dispatch({
        type: 'SET_SELECTED',
        payload: { symbol: 'SBER', provider: 'binance' },
      });

      store.dispatch({
        type: 'SET_PARAMS',
        payload: { tf: '1h', window: 200, horizon: 24, model: null },
      });

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>,
      );

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
      expect(ensureMock).toHaveBeenCalledTimes(1);

      const [ctxArg] = ensureMock.mock.calls[0];
      expect(ctxArg).toMatchObject({
        symbol: 'SBER',
        provider: 'BINANCE',
      });
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('in production skips unknown provider for timeseries (providerNorm=null)', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const store = createTestStore();

      store.dispatch({
        type: 'SET_SELECTED',
        payload: { symbol: 'SBER', provider: 'unknown' },
      });

      store.dispatch({
        type: 'SET_PARAMS',
        payload: { tf: '1h', window: 200, horizon: 24, model: null },
      });

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>,
      );

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
      expect(ensureMock).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('debounce: when selected changes quickly, only latest timeseries call happens', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      store.dispatch({
        type: 'SET_SELECTED',
        payload: { symbol: 'SBER', provider: 'binance' },
      });
      store.dispatch({
        type: 'SET_PARAMS',
        payload: { tf: '1h', window: 200, horizon: 24, model: null },
      });
    });

    // до истечения debounce меняем selected
    await act(async () => {
      vi.advanceTimersByTime(100);
      store.dispatch({
        type: 'SET_SELECTED',
        payload: { symbol: 'GAZP', provider: 'binance' },
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).toHaveBeenCalledTimes(1);

    const [ctxArg] = ensureMock.mock.calls[0];
    expect(ctxArg.symbol).toBe('GAZP');
  });

  it('runs forecast even when predict.request is null (falls back to selected+params)', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    // сначала авто ts
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.clearAllMocks();

    // request=null, но requestId++
    await act(async () => {
      store.dispatch({ type: 'PREDICT_EMPTY' });
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const runForecastMock = (ForecastManager as any).runForecast as Mock;
    expect(runForecastMock).toHaveBeenCalledTimes(1);
  });

  it('does not rerun forecast when requestId does not change', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.clearAllMocks();

    // 1st predict
    await act(async () => {
      store.dispatch({
        type: 'PREDICT',
        payload: {
          symbol: 'SBER',
          provider: 'binance',
          tf: '1h',
          window: 200,
          horizon: 24,
          model: null,
        },
      });
    });

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(300);
    });

    // просто прогоняем время ещё раз — requestId не менялся, новый запуск не должен появиться
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const runForecastMock = (ForecastManager as any).runForecast as Mock;
    expect(runForecastMock).toHaveBeenCalledTimes(1);
  });

  it('debounce: two quick predicts -> only latest forecast call happens', async () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.clearAllMocks();

    await act(async () => {
      store.dispatch({
        type: 'PREDICT',
        payload: {
          symbol: 'SBER',
          provider: 'binance',
          tf: '1h',
          window: 200,
          horizon: 24,
          model: null,
        },
      });
    });

    // ещё не прошло 250 — диспатчим второй predict с отличием
    await act(async () => {
      vi.advanceTimersByTime(100);
      store.dispatch({
        type: 'PREDICT',
        payload: {
          symbol: 'SBER',
          provider: 'binance',
          tf: '1h',
          window: 200,
          horizon: 12, // меняем, чтобы проверить "последний победил"
          model: null,
        },
      });
    });

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(300);
    });

    const runForecastMock = (ForecastManager as any).runForecast as Mock;
    expect(runForecastMock).toHaveBeenCalledTimes(1);

    const [ctxArg] = runForecastMock.mock.calls[0];
    expect(ctxArg.horizon).toBe(12);
  });

  it('in production skips unknown provider for forecast (providerNorm=null)', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const store = createTestStore();

      store.dispatch({
        type: 'SET_SELECTED',
        payload: { symbol: 'SBER', provider: 'unknown' },
      });
      store.dispatch({
        type: 'SET_PARAMS',
        payload: { tf: '1h', window: 200, horizon: 24, model: null },
      });

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>,
      );

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      vi.clearAllMocks();

      await act(async () => {
        store.dispatch({
          type: 'PREDICT',
          payload: {
            symbol: 'SBER',
            provider: 'unknown',
            tf: '1h',
            window: 200,
            horizon: 24,
            model: null,
          },
        });
      });

      await act(async () => {
        await Promise.resolve();
        vi.advanceTimersByTime(300);
      });

      const runForecastMock = (ForecastManager as any).runForecast as Mock;
      expect(runForecastMock).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });
});
