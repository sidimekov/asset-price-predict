import { configureStore } from '@reduxjs/toolkit';
import { marketApi } from '@/shared/api/marketApi';
import { backendApi } from '@/shared/api/backendApi';

export const store = configureStore({
  reducer: {
    [marketApi.reducerPath]: marketApi.reducer,
    [backendApi.reducerPath]: backendApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketApi.middleware, backendApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
