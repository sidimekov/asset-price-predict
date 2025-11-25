// apps/web/src/shared/api/marketApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Запросы без бизнес-логики, только HTTP

export interface BinanceTimeseriesRequest {
  symbol: string;
  interval: string; // бинансовский interval (может совпадать с timeframe)
  limit: number;
}

export type BinanceKline = [
  number, // openTime
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // closeTime
  string, // quoteAssetVolume
  number, // numberOfTrades
  string, // takerBuyBaseAssetVolume
  string, // takerBuyQuoteAssetVolume
  string, // ignore
];

export interface MockTimeseriesRequest {
  symbol: string;
  timeframe: string;
  limit: number;
}

export interface MoexTimeseriesRequest {
  symbol: string;
  timeframe: string;
  limit: number;
}

// ---- SEARCH ----

// для простоты поисковые эндпоинты принимают просто строку запроса (q)
export type SearchQuery = string;

export const marketApi = createApi({
  reducerPath: 'marketApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/market', // можно поменять/разнести по провайдерам
  }),
  endpoints: (builder) => ({
    // GET /api/market/binance/timeseries
    getBinanceTimeseries: builder.query<
      BinanceKline[],
      BinanceTimeseriesRequest
    >({
      query: ({ symbol, interval, limit }) => ({
        url: 'binance/timeseries',
        params: { symbol, interval, limit },
      }),
    }),

    // Заглушка под MOEX
    getMoexTimeseries: builder.query<unknown, MoexTimeseriesRequest>({
      query: ({ symbol, timeframe, limit }) => ({
        url: 'moex/timeseries',
        params: { symbol, timeframe, limit },
      }),
    }),

    // GET /api/market/mock
    getMockTimeseries: builder.query<unknown, MockTimeseriesRequest>({
      query: ({ symbol, timeframe, limit }) => ({
        url: 'mock',
        params: { symbol, timeframe, limit },
      }),
    }),

    // ---- SEARCH ENDPOINTS (сырой ответ провайдера, без нормализации) ----

    // GET /api/market/binance/search-symbols?q=...
    searchBinanceSymbols: builder.query<unknown, SearchQuery>({
      query: (q) => ({
        url: 'binance/search-symbols',
        params: { q },
      }),
    }),

    // GET /api/market/moex/search-symbols?q=...
    searchMoexSymbols: builder.query<unknown, SearchQuery>({
      query: (q) => ({
        url: 'moex/search-symbols',
        params: { q },
      }),
    }),

    // GET /api/market/mock/search-symbols?q=...
    // пока что можно не использовать, т.к. MOCK будет читать из статического массива
    searchMockSymbols: builder.query<unknown, SearchQuery>({
      query: (q) => ({
        url: 'mock/search-symbols',
        params: { q },
      }),
    }),
  }),
});

export const {
  useGetBinanceTimeseriesQuery,
  useLazyGetBinanceTimeseriesQuery,
  useGetMoexTimeseriesQuery,
  useLazyGetMoexTimeseriesQuery,
  useGetMockTimeseriesQuery,
  useLazyGetMockTimeseriesQuery,
  useSearchBinanceSymbolsQuery,
  useLazySearchBinanceSymbolsQuery,
  useSearchMoexSymbolsQuery,
  useLazySearchMoexSymbolsQuery,
  useSearchMockSymbolsQuery,
  useLazySearchMockSymbolsQuery,
} = marketApi;
