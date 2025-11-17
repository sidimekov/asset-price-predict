import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';

// мок ForecastManager
vi.mock('../ForecastManager', () => ({
  ForecastManager: {
    run: vi.fn().mockResolvedValue(undefined),
  },
}));
import { ForecastManager } from '@/processes/orchestrator/ForecastManager';

// reducer заглушка
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

// компонент для хука
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

    expect(ForecastManager.run).not.toHaveBeenCalled();
  });

  it('calls ForecastManager.run once when selected and params are set', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'MOCK' },
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

    // debounce
    vi.advanceTimersByTime(300);

    expect(ForecastManager.run).toHaveBeenCalledTimes(1);
    const [ctxArg] = (ForecastManager.run as any).mock.calls[0];

    expect(ctxArg).toMatchObject({
      symbol: 'SBER',
      provider: 'MOCK',
      tf: '1h',
      window: 200,
      horizon: 24,
    });
  });

  it('debounces multiple quick changes into one run', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'MOCK' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    // несколько раз меняем параметры до debounce
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 300, horizon: 24, model: null },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 300, horizon: 48, model: 'xgb' },
    });

    vi.advanceTimersByTime(300);

    expect(ForecastManager.run).toHaveBeenCalledTimes(1);
    const [ctxArg] = (ForecastManager.run as any).mock.calls[0];
    expect(ctxArg.window).toBe(300);
    expect(ctxArg.horizon).toBe(48);
    expect(ctxArg.model).toBe('xgb');
  });
});
