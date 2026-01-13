// apps/web/src/shared/api/marketApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import type { Bar } from '@shared/types/market';
import { createBaseQuery } from '@/shared/networking/baseQuery';

// Запросы без бизнес-логики, только HTTP

export interface BinanceTimeseriesRequest {
  symbol: string;
  interval: string; // бинансовский interval (может совпадать с timeframe)
  limit: number;
}

export type BinanceKlineRaw = [
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

export type BinanceSymbolRaw = {
  symbol: string;
  status?: string;
  baseAsset?: string;
  quoteAsset?: string;
  [key: string]: unknown;
};

export interface MockTimeseriesRequest {
  symbol: string;
  timeframe: string;
  limit: number;
}

export interface MoexTimeseriesRequest {
  symbol: string;
  engine: string;
  market: string;
  board: string;
  interval: number;
  from?: string;
  till?: string;
  limit?: number;
}

export type MoexCandleRaw = Array<number | string | null>;

export type MoexCandlesResponse = {
  candles: {
    columns: string[];
    data: MoexCandleRaw[];
  };
};

export type MoexSymbolRaw = Array<number | string | null>;

export type MoexSecuritiesResponse = {
  securities: {
    columns: string[];
    data: MoexSymbolRaw[];
  };
};

// ---- SEARCH ----

// для простоты поисковые эндпоинты принимают просто строку запроса (q)
export type SearchQuery = string;

export const marketApi = createApi({
  reducerPath: 'marketApi',
  baseQuery: createBaseQuery('/api/market'),
  endpoints: (builder) => ({
    // GET /api/market/binance/timeseries
    getBinanceTimeseries: builder.query<
      BinanceKlineRaw[],
      BinanceTimeseriesRequest
    >({
      query: ({ symbol, interval, limit }) => ({
        url: 'binance/timeseries',
        params: { symbol, interval, limit },
      }),
    }),

    // MOEX ISS (прямой запрос)
    getMoexTimeseries: builder.query<
      MoexCandlesResponse,
      MoexTimeseriesRequest
    >({
      query: ({
        symbol,
        engine,
        market,
        board,
        interval,
        from,
        till,
        limit,
      }) => ({
        url: `https://iss.moex.com/iss/engines/${engine}/markets/${market}/boards/${board}/securities/${symbol}/candles.json`,
        params: {
          interval,
          from,
          till,
          limit,
          'iss.meta': 'off',
          'iss.only': 'candles',
        },
      }),
    }),

    // GET /api/market/mock
    getMockTimeseries: builder.query<Bar[], MockTimeseriesRequest>({
      query: ({ symbol, timeframe, limit }) => ({
        url: 'mock',
        params: { symbol, timeframe, limit },
      }),
    }),

    // ---- SEARCH ENDPOINTS (сырой ответ провайдера, без нормализации) ----

    // GET /api/market/binance/search-symbols?q=...
    searchBinanceSymbols: builder.query<BinanceSymbolRaw[], SearchQuery>({
      query: (q) => ({
        url: 'binance/search-symbols',
        params: { q },
      }),
    }),

    // GET /api/market/moex/search-symbols?q=...
    searchMoexSymbols: builder.query<MoexSecuritiesResponse, SearchQuery>({
      query: (q) => ({
        url: 'https://iss.moex.com/iss/securities.json',
        params: { q, 'iss.meta': 'off', 'iss.only': 'securities' },
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
