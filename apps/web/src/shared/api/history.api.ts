import type { ForecastListReq, ForecastListRes } from '@assetpredict/shared';
import { backendApi } from '@/shared/api/backendApi';

export const historyApi = backendApi.injectEndpoints({
  endpoints: (builder) => ({
    getHistory: builder.query<ForecastListRes, ForecastListReq>({
      query: (params) => ({
        url: '/forecasts',
        method: 'GET',
        params,
      }),
    }),
  }),
});

export const { useGetHistoryQuery } = historyApi;
