// apps/web/src/__tests__/shared/api/marketApi.test.tsx
import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { marketApi } from '@/shared/api/marketApi';

function createTestStore() {
  return configureStore({
    reducer: {
      [marketApi.reducerPath]: marketApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(marketApi.middleware),
  });
}

describe('marketApi endpoints', () => {
  it('dispatches all endpoints without throwing', () => {
    const store = createTestStore();

    expect(() => {
      // Binance timeseries
      store.dispatch(
        marketApi.endpoints.getBinanceTimeseries.initiate({
          symbol: 'BTCUSDT',
          interval: '1h',
          limit: 10,
        }) as any,
      );

      // Moex timeseries
      store.dispatch(
        marketApi.endpoints.getMoexTimeseries.initiate({
          symbol: 'SBER',
          engine: 'stock',
          market: 'shares',
          board: 'TQBR',
          interval: 60,
          limit: 10,
        }) as any,
      );

      // Mock timeseries
      store.dispatch(
        marketApi.endpoints.getMockTimeseries.initiate({
          symbol: 'TEST',
          timeframe: '1h',
          limit: 10,
        }) as any,
      );

      // Binance search
      store.dispatch(
        marketApi.endpoints.searchBinanceSymbols.initiate('btc') as any,
      );

      // Moex search
      store.dispatch(
        marketApi.endpoints.searchMoexSymbols.initiate('sber') as any,
      );
    }).not.toThrow();
  });
});
