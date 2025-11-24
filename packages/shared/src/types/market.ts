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
 * Массив баров
 */
export type Bars = Bar[];

/**
 * Единый формат элемента каталога активов
 */
export type CatalogItem = {
  symbol: string;
  name: string;
  exchange?: string;
  assetClass?: 'equity' | 'fx' | 'crypto' | 'etf' | 'bond' | 'other';
  currency?: string;
  provider: Provider;
};

/**
 * Константы
 */
export const SUPPORTED_TIMEFRAMES: readonly Timeframe[] = [
  '1h',
  '8h',
  '1d',
  '7d',
  '1mo',
] as const;

export const SUPPORTED_PROVIDERS: readonly Provider[] = [
  'MOEX',
  'BINANCE',
  'CUSTOM',
  'MOCK',
] as const;
