import { backendApi } from '@/shared/api/backendApi';

export type HealthcheckRes = {
  status: string;
  version: string;
  db: boolean;
};

export const healthApi = backendApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthcheckRes, void>({
      query: () => ({
        url: '/health',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;
