import type {
  ForecastCreateReq,
  ForecastCreateRes,
  ForecastDetailRes,
  ForecastId,
  ForecastListReq,
  ForecastListRes,
} from '@assetpredict/shared';
import { backendApi } from '@/shared/api/backendApi';

export const forecastApi = backendApi.injectEndpoints({
  endpoints: (builder) => ({
    createForecast: builder.mutation<ForecastCreateRes, ForecastCreateReq>({
      query: (payload) => ({
        url: '/forecast',
        method: 'POST',
        body: payload,
      }),
    }),
    getForecasts: builder.query<ForecastListRes, ForecastListReq>({
      query: (params) => ({
        url: '/forecasts',
        method: 'GET',
        params,
      }),
    }),
    getForecastById: builder.query<ForecastDetailRes, ForecastId>({
      query: (id) => ({
        url: `/forecasts/${id}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useCreateForecastMutation,
  useGetForecastsQuery,
  useGetForecastByIdQuery,
} = forecastApi;
