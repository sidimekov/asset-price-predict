
// Ключ прогноза. Формат фактической строки задаётся makeForecastKey
// (symbol:tf:horizon:model)
export type ForecastKey = string;

// Одна точка прогноза в сторе: [timestamp, value]
export type ForecastPoint = [number, number];

// Ряд прогноза в сторе
export type ForecastSeries = ForecastPoint[];

/**
 * Backend-формат рядов прогноза (DTO из @assetpredict/shared).
 * Должен совпадать со структурой ForecastSeries в пакете shared:
 * {
 *   p10: number[];
 *   p50: number[];
 *   p90: number[];
 *   t: number[];
 * }
 *
 * Мы его используем только на границе Orchestrator -> Store,
 * а в сторе работаем с ForecastSeries = Array<[ts, value]>.
 */
export interface BackendForecastSeries {
  /** 10-й перцентиль (нижняя граница) */
  p10: number[];
  /** 50-й перцентиль (медиана) */
  p50: number[];
  /** 90-й перцентиль (верхняя граница) */
  p90: number[];
  /** Временные метки (timestamp) */
  t: number[];
}

/**
 * Строка таблицы факторов (UI-формат).
 * Логически соответствует ForecastFactor из shared.
 */
export interface ExplainRow {
  /** Название фактора */
  name: string;
  /** Влияние на прогноз (может быть позитивным/негативным) */
  impact: number;
  /** SHAP значение (если считаем) */
  shap?: number;
  /** Уверенность / важность фактора */
  conf?: number;
}

/**
 * Метаданные прогноза.
 * Логически соответствуют diag/metrics из backend (runtime, модель, backend).
 */
export interface ForecastMeta {
  /** Время выполнения (мс) */
  runtime_ms: number;
  /** Какой backend/воркер считал (например, 'local', 'cloud', 'mock') */
  backend: string;
  /** Версия модели */
  model_ver: string;
}

/**
 * Одна запись прогноза в сторе
 */
export interface ForecastEntry {
  /** Базовый ряд (P50) - обязателен */
  p50: ForecastSeries;
  /** Нижняя граница (P10) - опционально */
  p10?: ForecastSeries;
  /** Верхняя граница (P90) - опционально */
  p90?: ForecastSeries;
  /** Факторы explain - опционально */
  explain?: ExplainRow[];
  /** Метаданные по запуску прогноза */
  meta: ForecastMeta;
}

/**
 * Полный стейт среза forecast
 */
export interface ForecastState {
  byKey: Record<ForecastKey, ForecastEntry>;
  loadingByKey: Record<ForecastKey, boolean>;
  errorByKey: Record<ForecastKey, string | null>;
}
