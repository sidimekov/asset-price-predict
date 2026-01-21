import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { backendApi } from '@/shared/api/backendApi';
import type { ForecastId } from '@assetpredict/shared';
import { forecastApi } from '@/shared/api/forecast.api';

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

const getRequestMethod = (
  input: RequestInput | URL,
  init?: RequestInitType,
) => {
  if (init?.method) {
    return init.method;
  }

  if (input instanceof globalThis.Request) {
    return input.method;
  }

  return 'GET';
};

describe('forecastApi', () => {
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

  it('creates a forecast with POST', async () => {
    fetchMock.mockResolvedValue(resolveJson({ id: 'fc-1' }));

    const store = createTestStore();
    const result = store.dispatch(
      forecastApi.endpoints.createForecast.initiate({
        symbol: 'BTC',
        timeframe: '1h',
        horizon: 24,
      }) as any,
    );

    await result.unwrap();

    const [input, init] = fetchMock.mock.calls[0];
    const url = getRequestUrl(input);
    expect(url).toContain(`${backendBaseUrl}/forecast`);
    expect(getRequestMethod(input, init)).toBe('POST');
  });

  it('requests forecast list with query params', async () => {
    fetchMock.mockResolvedValue(resolveJson({ items: [] }));

    const store = createTestStore();
    const result = store.dispatch(
      forecastApi.endpoints.getForecasts.initiate({
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

  it('requests a forecast by id', async () => {
    fetchMock.mockResolvedValue(resolveJson({ id: 'forecast-1' }));

    const store = createTestStore();
    const forecastId = 'forecast-1' as ForecastId;
    const result = store.dispatch(
      forecastApi.endpoints.getForecastById.initiate(forecastId) as any,
    );

    await result.unwrap();

    const [input] = fetchMock.mock.calls[0];
    const url = getRequestUrl(input);
    expect(url).toContain(`${backendBaseUrl}/forecasts/forecast-1`);
  });
});
