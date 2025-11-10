/**
 * Утилиты для форматирования ошибок валидации Zod
 */

import { ZodError } from "zod";

/**
 * Форматирует ошибки Zod в читаемый формат
 * @param error - объект ошибки Zod
 * @returns массив строк с описанием ошибок
 */
export function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.length > 0 ? err.path.join(".") : "root";
    return `${path}: ${err.message}`;
  });
}

/**
 * Форматирует ошибки Zod в одну строку
 * @param error - объект ошибки Zod
 * @returns строка с описанием всех ошибок
 */
export function formatZodErrorsAsString(error: ZodError): string {
  return formatZodErrors(error).join("; ");
}

/**
 * Создает объект ошибки валидации для API ответов
 * @param error - объект ошибки Zod
 * @returns объект с полями errors и message
 */
export function createValidationErrorResponse(error: ZodError) {
  return {
    errors: error.errors,
    message: formatZodErrorsAsString(error),
  };
}
