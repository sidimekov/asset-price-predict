import React from 'react';
import { Provider } from 'react-redux';
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

// Мокаем ForecastManager
vi.mock('@/processes/orchestrator/ForecastManager', () => ({
  ForecastManager: {
    run: vi.fn().mockResolvedValue(undefined),
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
  state = { params: undefined as Params },
  action: any,
) => {
  switch (action.type) {
    case 'SET_PARAMS':
      return { ...state, params: action.payload };
    default:
      return state;
  }
};

const TestComponent: React.FC = () => {
  useOrchestrator();
  return <div />;
};

describe('useOrchestrator (branch version)', () => {
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

  it('maps provider=binance -> BINANCE and calls ForecastManager.run after debounce', () => {
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

    vi.advanceTimersByTime(300);

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).toHaveBeenCalledTimes(1);

    const [ctxArg, depsArg] = runMock.mock.calls[0];
    expect(ctxArg).toMatchObject({
      symbol: 'SBER',
      provider: 'BINANCE',
      tf: '1h',
      window: 200,
      horizon: 24,
    });

    expect(depsArg).toHaveProperty('dispatch');
    expect(depsArg).toHaveProperty('getState');
    expect(depsArg).toHaveProperty('signal');
  });

  it('maps provider=moex -> MOEX and calls ForecastManager.run', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'ROSN', provider: 'moex' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 500, horizon: 12, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock.mock.calls[0][0]).toMatchObject({
      symbol: 'ROSN',
      provider: 'MOEX',
      tf: '1h',
      window: 500,
      horizon: 12,
    });
  });

  it('does nothing for unknown provider (mapProviderToMarket returns null)', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'X', provider: 'unknown-provider' },
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

    vi.advanceTimersByTime(1000);

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).not.toHaveBeenCalled();
  });

  it('does nothing when window is invalid (<=0 or NaN)', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });

    // window <= 0
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 0, horizon: 24, model: null },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(1000);

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).not.toHaveBeenCalled();
  });

  it('does not rerun for the same signature on rerender', () => {
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

    rerender(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    vi.advanceTimersByTime(300);
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it('reruns when signature changes (window changes)', () => {
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

    // 1st run
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).toHaveBeenCalledTimes(1);

    // update params + force rerender (React cycle)
    act(() => {
      store.dispatch({
        type: 'SET_PARAMS',
        payload: { tf: '1h', window: 300, horizon: 24, model: null },
      });
    });

    rerender(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    // 2nd run after debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(runMock.mock.calls[1][0]).toMatchObject({ window: 300 });
  });

  it('cancels previous debounce when inputs change quickly (only latest run happens)', () => {
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

    // not enough to trigger first debounce yet
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // change selected before 250ms debounce expires
    act(() => {
      store.dispatch({
        type: 'SET_SELECTED',
        payload: { symbol: 'GAZP', provider: 'binance' },
      });
    });

    // force react cycle so effect runs with new selected
    rerender(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const runMock = (ForecastManager as any).run as Mock;

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock.mock.calls[0][0]).toMatchObject({ symbol: 'GAZP' });
  });

  it('aborts in cleanup on unmount (does not throw)', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'SET_SELECTED',
      payload: { symbol: 'SBER', provider: 'binance' },
    });
    store.dispatch({
      type: 'SET_PARAMS',
      payload: { tf: '1h', window: 200, horizon: 24, model: null },
    });

    const { unmount } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    // запланировали таймер, но не исполнили
    vi.advanceTimersByTime(100);

    // unmount должен вызвать cleanup с abort + clearTimeout
    expect(() => unmount()).not.toThrow();

    // даже если прогоним время = вызова run не будет
    vi.advanceTimersByTime(1000);

    const runMock = (ForecastManager as any).run as Mock;
    expect(runMock).not.toHaveBeenCalled();
  });
});
