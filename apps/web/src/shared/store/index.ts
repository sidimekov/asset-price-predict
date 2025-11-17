import { configureStore } from '@reduxjs/toolkit';
import { marketApi } from '@/shared/api/marketApi';
import { timeseriesReducer } from '@/entities/timeseries/model/timeseriesSlice';
import catalogReducer from '@/features/asset-catalog/model/catalogSlice';

export const store = configureStore({
  reducer: {
    [marketApi.reducerPath]: marketApi.reducer,
    timeseries: timeseriesReducer,
    catalog: catalogReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
