// src/shared/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { marketApi } from '@/shared/api/marketApi';
import { timeseriesReducer } from '@/entities/timeseries/model/timeseriesSlice';
import { backendApi } from '@/shared/api/backendApi';
import catalogReducer from '@/features/asset-catalog/model/catalogSlice';

export const store = configureStore({
  reducer: {
    timeseries: timeseriesReducer,
    [marketApi.reducerPath]: marketApi.reducer,
    catalog: catalogReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
