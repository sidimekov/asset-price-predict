/**
 * Рыночные типы для работы с биржевыми данными
 */

/**
 * Поддерживаемые таймфреймы
 */
export type Timeframe = '1h' | '8h' | '1d' | '7d' | '1mo';

/**
 * Поддерживаемые провайдеры данных
 */
export type Provider = 'MOEX' | 'BINANCE' | 'CUSTOM' | 'MOCK';

/**
 * Символ инструмента (тикер)
 */
export type Symbol = string;

/**
 * Один бар (свеча) - кортеж [timestamp, open, high, low, close, volume?]
 * timestamp - Unix timestamp в миллисекундах
 * open, high, low, close - цены открытия, максимум, минимум, закрытия
 * volume - объем (опционально)
 */
export type Bar = [
  ts: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume?: number,
];

/**
 * Массив баров, отсортированный от старых к новым (по возрастанию timestamp)
 */
export type Bars = Bar[];

/**
 * Константы поддерживаемых таймфреймов
 */
export const SUPPORTED_TIMEFRAMES: readonly Timeframe[] = [
  '1h',
  '8h',
  '1d',
  '7d',
  '1mo',
] as const;

/**
 * Константы поддерживаемых провайдеров
 */
export const SUPPORTED_PROVIDERS: readonly Provider[] = [
  'MOEX',
  'BINANCE',
  'CUSTOM',
] as const;

// Провайдеры данных рынка: базовые + фронтовый MOCK
export type MarketDataProvider = Provider | 'MOCK';

// Нормализованный элемент каталога инструментов
export type CatalogItem = {
  symbol: Symbol;
  name: string;
  exchange: string;
  assetClass: 'equity' | 'fx' | 'crypto' | 'etf' | 'bond' | 'other';
  currency?: string;
  provider: MarketDataProvider;
};
