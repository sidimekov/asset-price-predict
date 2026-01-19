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

const backendBaseUrl = (() => {
  const configuredUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(
    /\/+$/,
    '',
  );
  if (configuredUrl) {
    return configuredUrl;
  }
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  return 'http://localhost:3001';
})();

const ABSOLUTE_URL_RE = /^https?:\/\//i;

type CreateBaseQueryOptions = {
  withAuth?: boolean;
  withContentType?: boolean;
  allowAbsolute?: boolean;
  absolute?: {
    withAuth?: boolean;
    withContentType?: boolean;
  };
};

const buildBaseQuery = (
  baseUrl: string,
  options: Pick<CreateBaseQueryOptions, 'withAuth' | 'withContentType'>,
) =>
  fetchBaseQuery({
    baseUrl,
    timeout: 10_000,
    prepareHeaders: (headers) => {
      if (options.withAuth ?? true) {
        const token =
          typeof localStorage === 'undefined'
            ? null
            : localStorage.getItem('auth.token');

        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
      }

      if (options.withContentType ?? true) {
        if (!headers.has('content-type')) {
          headers.set('content-type', 'application/json');
        }
      }

      return headers;
    },
  });

export const createBaseQuery = (
  baseUrl: string,
  options: CreateBaseQueryOptions = {},
): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> => {
  const relativeBaseQuery = buildBaseQuery(baseUrl, {
    withAuth: options.withAuth,
    withContentType: options.withContentType,
  });

  if (options.allowAbsolute === false) {
    return relativeBaseQuery;
  }

  const absoluteBaseQuery = buildBaseQuery('', {
    withAuth: options.absolute?.withAuth ?? false,
    withContentType: options.absolute?.withContentType ?? false,
  });

  return (args, api, extraOptions) => {
    const url = typeof args === 'string' ? args : args.url;
    return (ABSOLUTE_URL_RE.test(url) ? absoluteBaseQuery : relativeBaseQuery)(
      args,
      api,
      extraOptions,
    );
  };
};

const rawBaseQuery = createBaseQuery(backendBaseUrl, {
  absolute: {
    withAuth: false,
    withContentType: false,
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
