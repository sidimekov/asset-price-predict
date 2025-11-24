// apps/web/src/config/market.ts

import {
  SUPPORTED_TIMEFRAMES,
  SUPPORTED_PROVIDERS,
  type Timeframe,
  type Provider,
} from '@shared/types/market';

// ---- TIMEFRAMES -------------------------------------------------

// просто реэкспортируем список из shared, чтобы не плодить копии
export { SUPPORTED_TIMEFRAMES };

// для удобства оставляем алиас-типа и дефолт
export type MarketTimeframe = Timeframe;
export const DEFAULT_TIMEFRAME: MarketTimeframe = '1h';

// ---- PROVIDERS --------------------------------------------------

// базовые провайдеры тоже берём из shared
export { SUPPORTED_PROVIDERS };

// алиас-типа для UI
export type MarketDataProvider = Provider;

// по ревью: custom-провайдер из shared считаем mock’ом по смыслу
export const DEFAULT_PROVIDER: MarketDataProvider = 'CUSTOM';

// ---- ПРОЧЕЕ -----------------------------------------------------

export const DEFAULT_LIMIT = 500;

// TTL клиентского кэша таймсерий, мс
export const CACHE_TTL_MS = 30_000;
