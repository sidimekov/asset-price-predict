import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const ABSOLUTE_URL_RE = /^https?:\/\//i;

export const createBaseQuery = (
  baseUrl: string,
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  const relativeQuery = fetchBaseQuery({ baseUrl });
  const absoluteQuery = fetchBaseQuery({ baseUrl: '' });

  return (args, api, extraOptions) => {
    const url = typeof args === 'string' ? args : args.url;
    if (ABSOLUTE_URL_RE.test(url)) {
      return absoluteQuery(args, api, extraOptions);
    }
    return relativeQuery(args, api, extraOptions);
  };
};
