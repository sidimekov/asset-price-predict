export const SUPPORTED_PROVIDERS = ['MOCK', 'BINANCE', 'MOEX'] as const;
export type MarketDataProvider = (typeof SUPPORTED_PROVIDERS)[number];

export const SUPPORTED_TIMEFRAMES = ['1h', '8h', '1d', '7d', '1mo'] as const;
export type MarketTimeframe = (typeof SUPPORTED_TIMEFRAMES)[number];

export const DEFAULT_PROVIDER: MarketDataProvider = 'MOCK';
export const DEFAULT_LIMIT = 200;
export const CACHE_TTL_MS = 60_000;
