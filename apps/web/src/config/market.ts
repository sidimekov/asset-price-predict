import {
  SUPPORTED_TIMEFRAMES as SHARED_TIMEFRAMES,
  SUPPORTED_PROVIDERS as SHARED_PROVIDERS,
  type Timeframe,
  type Provider,
} from '@assetpredict/shared';

// --- Timeframes ---
// Берём список таймфреймов и тип из shared
export const SUPPORTED_TIMEFRAMES = SHARED_TIMEFRAMES;
export type MarketTimeframe = Timeframe;

// --- Providers ---
// В shared нет 'MOCK', но он нужен для мок-провайдера в вебе.
// Поэтому расширяем список провайдеров локально.
export const SUPPORTED_PROVIDERS = ['MOCK', ...SHARED_PROVIDERS] as const;

// Тип провайдера в веб-приложении:
// - 'MOCK' для локального мок-провайдера
// - все реальные из @assetpredict/shared (MOEX, BINANCE, CUSTOM, и т.д.)
export type MarketDataProvider = (typeof SUPPORTED_PROVIDERS)[number];

// Провайдер по умолчанию
export const DEFAULT_PROVIDER: MarketDataProvider = 'MOCK';

// Остальные настройки рынка
export const DEFAULT_LIMIT = 200;

// TTL кэша таймсерий в миллисекундах
export const CACHE_TTL_MS = 60_000;
