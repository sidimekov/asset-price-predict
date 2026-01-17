import type { LoginReq, LoginRes, RegisterReq, RegisterRes } from '@assetpredict/shared';
import { backendApi } from '@/shared/api/backendApi';

type LogoutRes = { ok: boolean };

const setAuthToken = (token: string) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('auth.token', token);
  }
};

const clearAuthToken = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth.token');
  }
};

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
          setAuthToken(data.token);
        } catch {
          // handled by RTK Query
        }
      },
    }),
    register: builder.mutation<RegisterRes, RegisterReq>({
      query: (payload) => ({
        url: '/auth/register',
        method: 'POST',
        body: payload,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setAuthToken(data.token);
        } catch {
          // handled by RTK Query
        }
      },
    }),
    logout: builder.mutation<LogoutRes, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          clearAuthToken();
        } catch {
          // handled by RTK Query
        }
      },
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
