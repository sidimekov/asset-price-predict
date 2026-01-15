/**
 * @assetpredict/shared
 *
 * Единый пакет с типами, DTO и Zod-схемами для web и api
 */

// Типы
export * from './types/market.js';
export * from './types/common.js';

// DTO
export * from './dto/account.js';
export * from './dto/auth.js';
export * from './dto/forecast.js';

// Zod-схемы
export * from './schemas/market.schema.js';
export * from './schemas/common.schema.js';
export * from './schemas/forecast.schema.js';

// Утилиты
export * from './utils/zodErrors.js';

// Версия
export * from './version.js';
