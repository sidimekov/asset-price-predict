import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// сначала мокаем ForecastManager
vi.mock('@/processes/orchestrator/ForecastManager', () => ({
  ForecastManager: {
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

const forecastReducer = (state = { params: undefined as any }, action: any) => {
  switch (action.type) {
    case 'SET_PARAMS':
      return { ...state, params: action.payload };
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

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).not.toHaveBeenCalled();
  });

  it('calls ForecastManager.run once when selected and params are set', () => {
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

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).toHaveBeenCalledTimes(1);

    const [ctxArg, depsArg] = runMock.mock.calls[0];
    expect(ctxArg).toMatchObject({
      symbol: 'SBER',
      provider: 'BINANCE', // маппинг
      tf: '1h',
      window: 200,
      horizon: 24,
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

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).toHaveBeenCalledTimes(1);

    // rerender with same state
    rerender(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);
    expect(runMock).toHaveBeenCalledTimes(1);
  });
});
