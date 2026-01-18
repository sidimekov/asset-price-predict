import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/shared/networking/baseQuery';

export const backendApi = createApi({
  reducerPath: 'backendApi',
  baseQuery,
  endpoints: () => ({}),
});
