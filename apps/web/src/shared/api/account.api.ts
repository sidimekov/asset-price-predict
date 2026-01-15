import type { AccountRes } from '@assetpredict/shared';
import { backendApi } from '@/shared/api/backendApi';

export const accountApi = backendApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<AccountRes, void>({
      query: () => ({
        url: '/account',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetMeQuery } = accountApi;
