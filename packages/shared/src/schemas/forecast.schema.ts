/**
 * Zod-схемы для DTO прогнозов
 */

import { z } from 'zod';
import { zTimeframe, zSymbol } from './market.schema.js';
import { zISODate, zPagination } from './common.schema.js';
import { MAX_HORIZON } from '../types/common.js';

/**
 * Схема для идентификатора прогноза
 */
export const zForecastId = z.string();

/**
 * Схема для прогнозных рядов
 */
export const zForecastSeries = z.object({
  p10: z.array(z.number()),
  p50: z.array(z.number()),
  p90: z.array(z.number()),
  t: z.array(z.number()),
}).refine(
  (series) => {
    const { p10, p50, p90, t } = series;
    const len = t.length;
    // Проверка, что все массивы имеют одинаковую длину
    return p10.length === len && p50.length === len && p90.length === len;
  },
  { message: 'All series arrays (p10, p50, p90, t) must have the same length' }
).refine(
  (series) => {
    const { p10, p50, p90 } = series;
    // Проверка логики перцентилей: p10 <= p50 <= p90
    return p10.every((val, i) => val <= p50[i] && p50[i] <= p90[i]);
  },
  { message: 'Percentiles must satisfy: p10 <= p50 <= p90 for all points' }
);

/**
 * Схема для запроса на создание прогноза
 */
export const zForecastCreateReq = z.object({
  symbol: zSymbol,
  timeframe: zTimeframe,
  horizon: z.number().int().positive().max(MAX_HORIZON, {
    message: `Horizon must not exceed ${MAX_HORIZON}`,
  }),
  inputUntil: zISODate.optional(),
  model: z.string().optional(),
});

/**
 * Схема для элемента прогноза
 */
export const zForecastItem = z.object({
  id: zForecastId,
  symbol: zSymbol,
  timeframe: zTimeframe,
  createdAt: zISODate,
  horizon: z.number().int().positive(),
  series: zForecastSeries,
});

/**
 * Схема для ответа на создание прогноза
 */
export const zForecastCreateRes = zForecastItem;

/**
 * Схема для параметров запроса списка прогнозов
 */
export const zForecastListReq = zPagination.extend({
  symbol: zSymbol.optional(),
});

/**
 * Схема для краткого представления прогноза в списке
 */
export const zForecastListItem = z.object({
  id: zForecastId,
  symbol: zSymbol,
  timeframe: zTimeframe,
  createdAt: zISODate,
  horizon: z.number().int().positive(),
});

/**
 * Схема для ответа со списком прогнозов
 */
export const zForecastListRes = z.object({
  items: z.array(zForecastListItem),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

/**
 * Схема для фактора влияния
 */
export const zForecastFactor = z.object({
  name: z.string(),
  impact: z.number(),
  shap: z.number(),
  conf: z.number(),
});

/**
 * Схема для метрик качества
 */
export const zForecastMetrics = z.object({
  mae: z.number().nonnegative().optional(),
  mape: z.number().nonnegative().optional(),
  coverage: z.number().min(0).max(1).optional(),
});

/**
 * Схема для детального ответа о прогнозе
 */
export const zForecastDetailRes = zForecastItem.extend({
  factors: z.array(zForecastFactor).optional(),
  metrics: zForecastMetrics.optional(),
});

/**
 * Типы, выведенные из схем
 */
export type ForecastIdSchema = z.infer<typeof zForecastId>;
export type ForecastSeriesSchema = z.infer<typeof zForecastSeries>;
export type ForecastCreateReqSchema = z.infer<typeof zForecastCreateReq>;
export type ForecastItemSchema = z.infer<typeof zForecastItem>;
export type ForecastCreateResSchema = z.infer<typeof zForecastCreateRes>;
export type ForecastListReqSchema = z.infer<typeof zForecastListReq>;
export type ForecastListItemSchema = z.infer<typeof zForecastListItem>;
export type ForecastListResSchema = z.infer<typeof zForecastListRes>;
export type ForecastFactorSchema = z.infer<typeof zForecastFactor>;
export type ForecastMetricsSchema = z.infer<typeof zForecastMetrics>;
export type ForecastDetailResSchema = z.infer<typeof zForecastDetailRes>;

