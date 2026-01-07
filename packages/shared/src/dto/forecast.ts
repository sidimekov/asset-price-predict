/**
 * DTO для работы с прогнозами цен
 */

import type { BrandedId, ISODate, Pagination } from '../types/common.js';
import type { Symbol, Timeframe } from '../types/market.js';

/**
 * Идентификатор прогноза
 */
export type ForecastId = BrandedId<'forecast'> & string;

/**
 * Прогнозные ряды с доверительными интервалами
 */
export interface ForecastSeries {
  /** Нижняя граница (10-й перцентиль) */
  p10: number[];
  /** Медианное значение (50-й перцентиль) */
  p50: number[];
  /** Верхняя граница (90-й перцентиль) */
  p90: number[];
  /** Временные метки (Unix timestamp в миллисекундах) */
  t: number[];
}

/**
 * Запрос на создание прогноза
 */
export interface ForecastCreateReq {
  /** Символ инструмента */
  symbol: Symbol;
  /** Таймфрейм */
  timeframe: Timeframe;
  /** Горизонт прогнозирования (количество точек вперёд) */
  horizon: number;
  /** Дата, до которой брать данные для обучения (опционально) */
  inputUntil?: ISODate;
  /** Идентификатор модели (опционально) */
  model?: string;
}

/**
 * Элемент прогноза
 */
export interface ForecastItem {
  /** Идентификатор прогноза */
  id: ForecastId;
  /** Символ инструмента */
  symbol: Symbol;
  /** Таймфрейм */
  timeframe: Timeframe;
  /** Дата создания */
  createdAt: ISODate;
  /** Горизонт прогнозирования */
  horizon: number;
  /** Прогнозные ряды */
  series: ForecastSeries;
}

/**
 * Ответ на создание прогноза
 */
export type ForecastCreateRes = ForecastItem;

/**
 * Параметры запроса списка прогнозов
 */
export interface ForecastListReq extends Pagination {
  /** Фильтр по символу (опционально) */
  symbol?: Symbol;
}

/**
 * Краткое представление прогноза в списке
 */
export interface ForecastListItem {
  /** Идентификатор прогноза */
  id: ForecastId;
  /** Символ инструмента */
  symbol: Symbol;
  /** Таймфрейм */
  timeframe: Timeframe;
  /** Дата создания */
  createdAt: ISODate;
  /** Горизонт прогнозирования */
  horizon: number;
}

/**
 * Ответ со списком прогнозов
 */
export interface ForecastListRes {
  /** Список прогнозов */
  items: ForecastListItem[];
  /** Общее количество прогнозов */
  total: number;
  /** Номер страницы */
  page: number;
  /** Лимит на странице */
  limit: number;
}

/**
 * Фактор влияния на прогноз
 */
export interface ForecastFactor {
  /** Название фактора */
  name: string;
  /** Влияние на прогноз */
  impact: number;
  /** SHAP значение */
  shap: number;
  /** Уверенность */
  conf: number;
}

/**
 * Метрики качества прогноза
 */
export interface ForecastMetrics {
  /** Средняя абсолютная ошибка */
  mae?: number;
  /** Средняя абсолютная процентная ошибка */
  mape?: number;
  /** Покрытие доверительного интервала */
  coverage?: number;
}

/**
 * Детальный ответ о прогнозе
 */
export interface ForecastDetailRes extends ForecastItem {
  /** Факторы влияния (опционально) */
  factors?: ForecastFactor[];
  /** Метрики качества (опционально) */
  metrics?: ForecastMetrics;
}
