import type { AccountRes, UpdateAccountReq } from '@assetpredict/shared';
import { backendApi } from '@/shared/api/backendApi';

export const accountApi = backendApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<AccountRes, void>({
      query: () => ({
        url: '/account',
        method: 'GET',
      }),
    }),
    updateMe: builder.mutation<AccountRes, UpdateAccountReq>({
      query: (payload) => ({
        url: '/account',
        method: 'PATCH',
        body: payload,
      }),
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation } = accountApi;
