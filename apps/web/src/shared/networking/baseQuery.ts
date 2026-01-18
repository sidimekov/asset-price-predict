import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { normalizeHttpError } from './errors';
import type { HttpError } from './types';

const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || '/api';

const ABSOLUTE_URL_RE = /^https?:\/\//i;

type HeadersInstance = InstanceType<typeof globalThis.Headers>;

const getUrl = (args: string | FetchArgs) =>
  typeof args === 'string' ? args : args.url;

export const createBaseQuery = (
  baseUrl: string,
): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> => {
  const queryOptions = {
    baseUrl,
    timeout: 10_000,
    prepareHeaders: (headers: HeadersInstance) => {
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
  };

  const relativeBaseQuery = fetchBaseQuery(queryOptions);
  const absoluteBaseQuery = fetchBaseQuery({ ...queryOptions, baseUrl: '' });

  return (args, api, extraOptions) =>
    (ABSOLUTE_URL_RE.test(getUrl(args))
      ? absoluteBaseQuery
      : relativeBaseQuery)(args, api, extraOptions);
};

const rawBaseQuery = createBaseQuery(backendBaseUrl);

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
  HttpError,
  {},
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  const result: QueryReturnValue<
    unknown,
    FetchBaseQueryError,
    FetchBaseQueryMeta
  > = await rawBaseQuery(args, api, extraOptions);

  if (process.env.NODE_ENV === 'development') {
    const { method, url } = getRequestInfo(args);
    const status =
      'error' in result && result.error
        ? result.error.status
        : result.meta?.response?.status;

    console.debug('[Networking]', method, url, status ?? 'no-status');
  }

  if ('error' in result && result.error) {
    return { error: normalizeHttpError(result.error) };
  }

  return { data: result.data, meta: result.meta };
};
