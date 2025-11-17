import { describe, it, expect } from 'vitest';
import { store } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import { expectTypeOf } from 'vitest';

describe('store configuration', () => {
  it('registers RTK Query reducers', () => {
    const state = store.getState();
    expect(state).toHaveProperty(marketApi.reducerPath);
  });

  it('registers timeseries reducer', () => {
    const state = store.getState();
    expect(state).toHaveProperty('timeseries');
  });

  it('registers catalog reducer', () => {
    const state = store.getState();
    expect(state).toHaveProperty('catalog');
  });

  it('dispatch is a function', () => {
    expect(typeof store.dispatch).toBe('function');
  });

  it('types are exported correctly', () => {
    expectTypeOf(store.dispatch).toBeFunction();
  });
});
