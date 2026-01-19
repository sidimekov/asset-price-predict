import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { backendApi } from '@/shared/api/backendApi';
import { historyApi } from '@/shared/api/history.api';

const createTestStore = () =>
  configureStore({
    reducer: {
      [backendApi.reducerPath]: backendApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(backendApi.middleware),
  });

const resolveJson = (data: unknown) =>
  new globalThis.Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

type RequestInput = Parameters<typeof globalThis.fetch>[0];
type RequestInitType = Parameters<typeof globalThis.fetch>[1];

const getRequestUrl = (input: RequestInput | URL) => {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

describe('historyApi', () => {
  const fetchMock = vi.fn();
  const NativeRequest = globalThis.Request;
  const baseUrl = 'http://localhost';
  const backendBaseUrl = (() => {
    const configuredUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(
      /\/+$/,
      '',
    );
    if (configuredUrl) {
      return configuredUrl;
    }
    return 'http://localhost:3001';
  })();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal(
      'Request',
      class extends NativeRequest {
        constructor(input: RequestInput | URL, init?: RequestInitType) {
          const requestUrl =
            typeof input === 'string' || input instanceof URL
              ? input.toString()
              : input.url;

          const safeInit = init ? { ...init, signal: undefined } : init;
          super(new URL(requestUrl, baseUrl).toString(), safeInit);
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests history list with query params', async () => {
    fetchMock.mockResolvedValue(resolveJson({ items: [] }));

    const store = createTestStore();
    const result = store.dispatch(
      historyApi.endpoints.getHistory.initiate({
        page: 1,
        limit: 10,
        symbol: 'BTC',
      }) as any,
    );

    await result.unwrap();

    const [input] = fetchMock.mock.calls[0];
    const url = getRequestUrl(input);
    expect(url).toContain(`${backendBaseUrl}/forecasts`);
    expect(url).toContain('symbol=BTC');
  });
});
