/**
 * Общие типы для работы с идентификаторами, датами и пагинацией
 */

/**
 * Брендированный тип для идентификаторов
 * Позволяет различать разные типы ID на уровне типов TypeScript
 * @example
 * type ForecastId = BrandedId<'forecast'> & string;
 * type UserId = BrandedId<'user'> & string;
 */
export type BrandedId<T extends string> = string & { __brand: T };

/**
 * Дата в формате ISO 8601
 * @example "2025-01-31T12:00:00Z"
 */
export type ISODate = string;

/**
 * Параметры пагинации
 */
export interface Pagination {
  /** Номер страницы (начиная с 1) */
  page: number;
  /** Количество элементов на странице */
  limit: number;
}

/**
 * Временной диапазон с опциональными границами
 */
export interface Range {
  /** Начальная дата (включительно) */
  from?: ISODate;
  /** Конечная дата (включительно) */
  to?: ISODate;
}

/**
 * Максимальный горизонт прогноза (количество точек вперёд)
 */
export const MAX_HORIZON = 500;

/**
 * Максимальное количество баров в временном ряде
 */
export const MAX_BARS = 50_000;
