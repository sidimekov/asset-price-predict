import { configureStore } from '@reduxjs/toolkit';
import { marketApi } from '@/shared/api/marketApi';
import { backendApi } from '@/shared/api/backendApi';
import { forecastReducer } from '@/entities/forecast/model/forecastSlice';
import { timeseriesReducer } from '@/entities/timeseries/model/timeseriesSlice';

export const store = configureStore({
  reducer: {
    [marketApi.reducerPath]: marketApi.reducer,
    [backendApi.reducerPath]: backendApi.reducer,
    forecast: forecastReducer,
    timeseries: timeseriesReducer, // <-- добавили
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketApi.middleware, backendApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
