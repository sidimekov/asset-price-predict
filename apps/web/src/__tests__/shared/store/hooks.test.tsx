import React, { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';

import { store } from '@/shared/store';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';

// Простой тестовый редьюсер для локального стора
const counterReducer = (state = { value: 0 }, action: { type: string }) => {
  switch (action.type) {
    case 'increment':
      return { value: state.value + 1 };
    default:
      return state;
  }
};

const createTestStore = () =>
  configureStore({
    reducer: {
      counter: counterReducer,
    },
  });

describe('store hooks', () => {
  it('useAppDispatch и useAppSelector работают внутри настоящего Provider со store', () => {
    let capturedDispatch: unknown;
    let capturedState: unknown;

    function TestComponent() {
      capturedDispatch = useAppDispatch();
      capturedState = useAppSelector((s) => s);
      return null;
    }

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    expect(typeof capturedDispatch).toBe('function');
    expect(capturedState).toEqual(store.getState());
  });

  it('useAppSelector читает данные из тестового стора', () => {
    const testStore = createTestStore();

    const SelectorTest: React.FC = () => {
      const value = useAppSelector((state) => state.counter.value);
      return <div>Value: {value}</div>;
    };

    render(
      <Provider store={testStore}>
        <SelectorTest />
      </Provider>,
    );

    expect(screen.getByText('Value: 0')).toBeInTheDocument();
  });

  it('useAppDispatch диспатчит экшены и меняет стейт в тестовом сторе', async () => {
    const testStore = createTestStore();

    const DispatchTest: React.FC = () => {
      const dispatch = useAppDispatch();
      const value = useAppSelector((state) => state.counter.value);

      useEffect(() => {
        dispatch({ type: 'increment' });
      }, [dispatch]);

      return <div>Value: {value}</div>;
    };

    render(
      <Provider store={testStore}>
        <DispatchTest />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Value: 1')).toBeInTheDocument();
    });

    expect(testStore.getState().counter.value).toBe(1);
  });
});
