import {
  SUPPORTED_TIMEFRAMES,
  SUPPORTED_PROVIDERS,
  type Timeframe,
  type Provider,
} from '@shared/types/market';

export { SUPPORTED_TIMEFRAMES };

export type MarketTimeframe = Timeframe;
export const DEFAULT_TIMEFRAME: MarketTimeframe = '1h';

export { SUPPORTED_PROVIDERS };

export type MarketDataProvider = Provider;

export const DEFAULT_PROVIDER: MarketDataProvider = 'CUSTOM';

export const DEFAULT_LIMIT = 500;

export const CACHE_TTL_MS = 30_000;
