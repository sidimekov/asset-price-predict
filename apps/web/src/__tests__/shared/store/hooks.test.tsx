import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect } from 'vitest';

import { store } from '@/shared/store';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';

describe('store hooks', () => {
  it('useAppDispatch и useAppSelector работают с реальным store', () => {
    const result: { dispatchType?: string; hasForecastSlice?: boolean } = {};

    const TestComponent = () => {
      const dispatch = useAppDispatch();
      const forecast = useAppSelector((s) => s.forecast);

      result.dispatchType = typeof dispatch;
      result.hasForecastSlice = !!forecast;

      return null;
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    expect(result.dispatchType).toBe('function');
    expect(result.hasForecastSlice).toBe(true);
  });
});
