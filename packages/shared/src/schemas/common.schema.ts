/**
 * Zod-схемы для общих типов
 */

import { z } from "zod";

/**
 * Схема для ISO-даты (строка в формате ISO 8601)
 */
export const zISODate = z.string().datetime();

/**
 * Схема для брендированного идентификатора (просто строка)
 */
export const zBrandedId = <T extends string>() =>
  z.string() as unknown as z.ZodType<string & { __brand: T }>;

/**
 * Схема для пагинации
 */
export const zPagination = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

/**
 * Схема для временного диапазона
 */
export const zRange = z.object({
  from: zISODate.optional(),
  to: zISODate.optional(),
});

/**
 * Типы, выведенные из схем
 */
export type ISODateSchema = z.infer<typeof zISODate>;
export type PaginationSchema = z.infer<typeof zPagination>;
export type RangeSchema = z.infer<typeof zRange>;
