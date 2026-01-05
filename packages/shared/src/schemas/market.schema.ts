/**
 * Zod-схемы для рыночных типов
 */

import { z } from 'zod';
import { MAX_BARS } from '../types/common.js';

/**
 * Схема для таймфрейма
 */
export const zTimeframe = z.enum(['1h', '8h', '1d', '7d', '1mo'] as const);

/**
 * Схема для провайдера
 */
export const zProvider = z.enum(['MOEX', 'BINANCE', 'CUSTOM'] as const);

/**
 * Схема для символа (тикера)
 */
export const zSymbol = z.string().min(1);

/**
 * Схема для одного бара (свечи)
 * [timestamp, open, high, low, close, volume?]
 */
export const zBar = z
  .union([
    // Бар с volume
    z.tuple([
      z.number(), // ts
      z.number().nonnegative(), // open
      z.number().nonnegative(), // high
      z.number().nonnegative(), // low
      z.number().nonnegative(), // close
      z.number().nonnegative(), // volume
    ]),
    // Бар без volume
    z.tuple([
      z.number(), // ts
      z.number().nonnegative(), // open
      z.number().nonnegative(), // high
      z.number().nonnegative(), // low
      z.number().nonnegative(), // close
    ]),
  ])
  .refine(
    (bar) => {
      const [, open, high, low, close] = bar;
      // Проверка логики OHLC: high >= max(open, close), low <= min(open, close)
      return high >= Math.max(open, close) && low <= Math.min(open, close);
    },
    {
      message:
        'Invalid OHLC values: high must be >= max(open,close) and low must be <= min(open,close)',
    },
  );

/**
 * Схема для массива баров с проверкой монотонности времени
 */
export const zBars = z
  .array(zBar)
  .max(MAX_BARS, {
    message: `Bars array exceeds maximum length of ${MAX_BARS}`,
  })
  .refine(
    (bars) => {
      // Проверка монотонности: timestamp должен не убывать
      for (let i = 1; i < bars.length; i++) {
        if (bars[i][0] < bars[i - 1][0]) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        'Bars must be sorted by timestamp in ascending order (oldest to newest)',
    },
  );

/**
 * Типы, выведенные из схем
 */
export type TimeframeSchema = z.infer<typeof zTimeframe>;
export type ProviderSchema = z.infer<typeof zProvider>;
export type SymbolSchema = z.infer<typeof zSymbol>;
export type BarSchema = z.infer<typeof zBar>;
export type BarsSchema = z.infer<typeof zBars>;
