import React, { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';

import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';

// Простой тестовый редьюсер
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
  it('useAppSelector читает данные из стора', () => {
    const store = createTestStore();

    const SelectorTest: React.FC = () => {
      const value = useAppSelector((state) => state.counter.value);
      return <div>Value: {value}</div>;
    };

    render(
      <Provider store={store}>
        <SelectorTest />
      </Provider>,
    );

    expect(screen.getByText('Value: 0')).toBeInTheDocument();
  });

  it('useAppDispatch диспатчит экшены и меняет стейт', async () => {
    const store = createTestStore();

    const DispatchTest: React.FC = () => {
      const dispatch = useAppDispatch();
      const value = useAppSelector((state) => state.counter.value);

      useEffect(() => {
        dispatch({ type: 'increment' });
      }, [dispatch]);

      return <div>Value: {value}</div>;
    };

    render(
      <Provider store={store}>
        <DispatchTest />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Value: 1')).toBeInTheDocument();
    });

    // дополнительная проверка на самом сторе
    expect(store.getState().counter.value).toBe(1);
  });
});
