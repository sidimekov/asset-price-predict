import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { normalizeHttpError } from './errors';
import type { HttpError } from './types';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  timeout: 10_000,
  prepareHeaders: (headers) => {
    const token =
      typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem('auth.token');

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    return headers;
  },
});

const getRequestInfo = (args: string | FetchArgs) => {
  if (typeof args === 'string') {
    return { method: 'GET', url: args };
  }

  return {
    method: (args.method ?? 'GET').toUpperCase(),
    url: args.url,
  };
};

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  HttpError
> = async (args, api, extraOptions) => {
  const result = (await rawBaseQuery(args, api, extraOptions)) as {
    error?: FetchBaseQueryError;
  };

  if (process.env.NODE_ENV === 'development') {
    const { method, url } = getRequestInfo(args);
    const status = result.error
      ? result.error.status
      : result.meta?.response?.status;

    // eslint-disable-next-line no-console
    console.debug('[Networking]', method, url, status ?? 'no-status');
  }

  if (result.error) {
    return { error: normalizeHttpError(result.error) };
  }

  return result;
};
