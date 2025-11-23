// src/shared/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { marketApi } from '@/shared/api/marketApi';
import { backendApi } from '@/shared/api/backendApi';
import { timeseriesReducer } from '@/entities/timeseries/model/timeseriesSlice'; // 👈 новый импорт

export const store = configureStore({
  reducer: {
    timeseries: timeseriesReducer,
    [marketApi.reducerPath]: marketApi.reducer,
    [backendApi.reducerPath]: backendApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketApi.middleware, backendApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
