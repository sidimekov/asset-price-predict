import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';

import { store } from '@/shared/store';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';

describe('store hooks', () => {
  it('useAppDispatch and useAppSelector work inside Provider', () => {
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
});
