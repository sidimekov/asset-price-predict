import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const marketApi = createApi({
  reducerPath: 'marketApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/market' }),
  endpoints: () => ({}),
});
