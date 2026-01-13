import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const createBaseQuery = (baseUrl: string) => fetchBaseQuery({ baseUrl });
