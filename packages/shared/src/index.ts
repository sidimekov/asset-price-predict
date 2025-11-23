/**
 * @assetpredict/shared
 *
 * Единый пакет с типами, DTO и Zod-схемами для web и api
 */

// Типы
export * from './types/market';
export * from './types/common';

// DTO
export * from './dto/forecast';

// Zod-схемы
export * from './schemas/market.schema';
export * from './schemas/common.schema';
export * from './schemas/forecast.schema';

// Утилиты
export * from './utils/zodErrors';

// Версия
export * from './version';
