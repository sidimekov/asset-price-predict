import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// сначала мокаем ForecastManager
vi.mock('@/processes/orchestrator/ForecastManager', () => ({
  ForecastManager: {
    ensureTimeseriesOnly: vi.fn().mockResolvedValue(undefined),
    runForecast: vi.fn().mockResolvedValue(undefined),
  },
}));

import { ForecastManager } from '@/processes/orchestrator/ForecastManager';
import {
  useOrchestrator,
  __resetOrchestratorStateForTests,
} from '@/processes/orchestrator/useOrchestrator';
import { DEFAULT_LIMIT, DEFAULT_TIMEFRAME } from '@/config/market';

const catalogReducer = (
  state = { selected: undefined as any },
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
    params: undefined as any,
    predict: { requestId: 0, request: null as any },
  },
  action: any,
) => {
  switch (action.type) {
    case 'SET_PARAMS':
      return { ...state, params: action.payload };
    case 'SET_PREDICT':
      return { ...state, predict: action.payload };
    default:
      return state;
  }
};

const TestComponent: React.FC = () => {
  useOrchestrator();
  const selected = useSelector((s: any) => s.catalog.selected);
  const params = useSelector((s: any) => s.forecast.params);

  return (
    <div>
      <div data-testid="symbol">{selected?.symbol ?? 'none'}</div>
      <div data-testid="tf">{params?.tf ?? 'none'}</div>
    </div>
  );
};

describe('useOrchestrator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    __resetOrchestratorStateForTests();
  });

  const createTestStore = () =>
    configureStore({
      reducer: {
        catalog: catalogReducer,
        forecast: forecastReducer,
      },
    });

  it('does nothing when selected or params are missing', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(1000);

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).not.toHaveBeenCalled();
  });

  it('calls ForecastManager.ensureTimeseriesOnly once when selected and params are set', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' }, // важно: как в catalogSlice
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

    vi.advanceTimersByTime(300);

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).toHaveBeenCalledTimes(1);

    const [ctxArg, depsArg] = ensureMock.mock.calls[0];
    expect(ctxArg).toMatchObject({
      symbol: 'SBER',
      provider: 'BINANCE',
      tf: '1h',
      window: 200,
    });

    // deps should include getState + signal
    expect(depsArg).toHaveProperty('dispatch');
    expect(depsArg).toHaveProperty('getState');
    expect(depsArg).toHaveProperty('signal');
  });

  it('does not rerun ForecastManager for the same signature on rerender', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    const { rerender } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).toHaveBeenCalledTimes(1);

    // rerender with same state
    rerender(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);
    expect(ensureMock).toHaveBeenCalledTimes(1);
  });

  it('uses default params when params are missing', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).toHaveBeenCalledTimes(1);
    const expectedWindow =
      process.env.NODE_ENV !== 'production' ? 200 : DEFAULT_LIMIT;
    expect(ensureMock.mock.calls[0][0]).toMatchObject({
      tf: DEFAULT_TIMEFRAME,
      window: expectedWindow,
    });
  });

  it('skips timeseries when window is invalid', () => {
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

    vi.advanceTimersByTime(300);

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).not.toHaveBeenCalled();
  });

  it('skips timeseries when provider is missing', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: '' },
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

    vi.advanceTimersByTime(300);

    const ensureMock = (ForecastManager as any).ensureTimeseriesOnly as Mock;
    expect(ensureMock).not.toHaveBeenCalled();
  });

  it('runs forecast when predict request is issued', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_PREDICT',
      payload: {
        requestId: 1,
        request: {
          symbol: 'BTC',
          provider: 'binance',
          tf: '1h',
          window: 120,
          horizon: 12,
          model: 'client',
        },
      },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);

    const runForecastMock = (ForecastManager as any).runForecast as Mock;
    expect(runForecastMock).toHaveBeenCalledTimes(1);

    const [ctxArg, depsArg] = runForecastMock.mock.calls[0];
    expect(ctxArg).toMatchObject({
      symbol: 'BTC',
      provider: 'BINANCE',
      tf: '1h',
      window: 120,
      horizon: 12,
      model: 'client',
    });
    expect(depsArg).toHaveProperty('dispatch');
    expect(depsArg).toHaveProperty('getState');
    expect(depsArg).toHaveProperty('signal');
  });

  it('skips forecast when predict request is incomplete', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_PREDICT',
      payload: {
        requestId: 2,
        request: {
          symbol: 'BTC',
          provider: 'binance',
          tf: '1h',
          window: 120,
          horizon: 0,
          model: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);

    const runForecastMock = (ForecastManager as any).runForecast as Mock;
    expect(runForecastMock).not.toHaveBeenCalled();
  });

  it('does not rerun forecast for the same predict request id', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_PREDICT',
      payload: {
        requestId: 1,
        request: {
          symbol: 'BTC',
          provider: 'binance',
          tf: '1h',
          window: 120,
          horizon: 12,
          model: null,
        },
      },
    });

    const { rerender } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);

    const runForecastMock = (ForecastManager as any).runForecast as Mock;
    expect(runForecastMock).toHaveBeenCalledTimes(1);

    rerender(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);
    expect(runForecastMock).toHaveBeenCalledTimes(1);
  });
});
