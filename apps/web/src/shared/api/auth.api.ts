import type { LoginReq, LoginRes } from '@assetpredict/shared';
import { backendApi } from '@/shared/api/backendApi';

export const authApi = backendApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginRes, LoginReq>({
      query: (payload) => ({
        url: '/auth/login',
        method: 'POST',
        body: payload,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('auth.token', data.token);
          }
        } catch {
          // handled by RTK Query
        }
      },
    }),
  }),
});

export const { useLoginMutation } = authApi;
