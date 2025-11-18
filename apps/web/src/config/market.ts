// apps/web/src/config/market.ts

// Берём ТОЛЬКО типы из shared — на рантайме этот импорт не нужен.
import type { Timeframe, Provider } from '@shared/types/market';

// ---- TIMEFRAMES ----

// Литеральный список таймфреймов, при этом TS проверяет,
// что каждый из них совместим с общим типом Timeframe.
export const SUPPORTED_TIMEFRAMES = [
  '1h',
  '8h',
  '1d',
  '7d',
  '1mo',
] as const satisfies Timeframe[];

// Тип для фронта — просто union из элементов кортежа
export type MarketTimeframe = (typeof SUPPORTED_TIMEFRAMES)[number];

export const DEFAULT_TIMEFRAME: MarketTimeframe = '1h';

// ---- PROVIDERS ----

// Базовые провайдеры из бекенда
const CORE_PROVIDERS = [
  'BINANCE',
  'MOEX',
  'CUSTOM',
] as const satisfies Provider[];

// Плюс наш фронтовый MOCK
export const SUPPORTED_PROVIDERS = ['MOCK', ...CORE_PROVIDERS] as const;

// Union-типа из кортежа
export type MarketDataProvider = (typeof SUPPORTED_PROVIDERS)[number];

export const DEFAULT_PROVIDER: MarketDataProvider = 'MOCK';

// ---- ПРОЧЕЕ ----

export const DEFAULT_LIMIT = 500;

// TTL клиентского кэша таймсерий, мс
export const CACHE_TTL_MS = 30_000;
