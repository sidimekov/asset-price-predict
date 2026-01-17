import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { backendApi } from '@/shared/api/backendApi';
import { authApi } from '@/shared/api/auth.api';

const createTestStore = () =>
  configureStore({
    reducer: {
      [backendApi.reducerPath]: backendApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(backendApi.middleware),
  });

const resolveJson = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const getRequestUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

describe('authApi token handling', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores auth token after login', async () => {
    fetchMock.mockImplementation((input) => {
      const url = getRequestUrl(input);
      if (url.endsWith('/api/auth/login')) {
        return Promise.resolve(
          resolveJson({
            token: 'login-token',
            user: { id: '1', email: 'user@test.com', username: 'user' },
          }),
        );
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    const store = createTestStore();
    const result = store.dispatch(
      authApi.endpoints.login.initiate({
        email: 'user@test.com',
        password: 'secret',
      }) as any,
    );

    await result.unwrap();

    expect(localStorage.getItem('auth.token')).toBe('login-token');
  });

  it('clears auth token after logout', async () => {
    localStorage.setItem('auth.token', 'existing-token');

    fetchMock.mockImplementation((input) => {
      const url = getRequestUrl(input);
      if (url.endsWith('/api/auth/logout')) {
        return Promise.resolve(resolveJson({ ok: true }));
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    const store = createTestStore();
    const result = store.dispatch(authApi.endpoints.logout.initiate() as any);

    await result.unwrap();

    expect(localStorage.getItem('auth.token')).toBeNull();
  });
});
