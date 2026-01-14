import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

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

// 2) Мокаем ForecastManager (теперь есть ensureTimeseriesOnly)
vi.mock('@/processes/orchestrator/ForecastManager', () => ({
  ForecastManager: {
    ensureTimeseriesOnly: vi.fn().mockResolvedValue(undefined),
    runForecast: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue(undefined),
  },
}));

import { ForecastManager } from '@/processes/orchestrator/ForecastManager';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';

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
    predict: { requestId: 0, request: null },
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
    default:
      return state;
  }
};

const TestComponent: React.FC = () => {
  useOrchestrator();

  // просто чтобы компонент реально подписался на стор
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

  it('calls ForecastManager.ensureTimeseriesOnly once when selected and params are set (auto history)', async () => {
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
      provider: 'MOCK',
      tf: '1h',
      window: 200,
    });

    expect(depsArg).toHaveProperty('dispatch');
    expect(depsArg).toHaveProperty('getState');
    expect(depsArg).toHaveProperty('signal');
  });

  it('does not rerun ensureTimeseriesOnly for the same signature when state updates with same values', async () => {
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

    // обновляем стор теми же значениями (новые ссылки, но сигнатура та же)
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

  it('calls ForecastManager forecast entrypoint when Predict trigger fires', async () => {
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

    const before = store.getState() as any;
    const beforeId = before.forecast?.predict?.requestId ?? 0;

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

    const after = store.getState() as any;
    const afterId = after.forecast?.predict?.requestId ?? 0;

    // реально изменили requestId
    expect(afterId).toBe(beforeId + 1);

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    const runForecastMock = (ForecastManager as any).runForecast as Mock;
    const runMock = (ForecastManager as any).run as Mock;

    const totalCalls =
      (runForecastMock?.mock?.calls?.length ?? 0) +
      (runMock?.mock?.calls?.length ?? 0);

    expect(totalCalls).toBe(1);

    const call = (runForecastMock?.mock?.calls?.[0] ??
      runMock?.mock?.calls?.[0]) as any;

    const [ctxArg, depsArg] = call;

    expect(ctxArg).toMatchObject({
      symbol: 'SBER',
      provider: 'MOCK', // dev override
      tf: '1h',
      window: 200,
      horizon: 24,
    });

    expect(depsArg).toHaveProperty('dispatch');
    expect(depsArg).toHaveProperty('getState');
    expect(depsArg).toHaveProperty('signal');
  });
});
