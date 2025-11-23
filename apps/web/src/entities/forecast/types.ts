export type ForecastKey = string; // symbol:tf:horizon:model

// Одна точка прогноза: [timestamp, value]
export type ForecastPoint = [number, number];

// Ряд прогноза
export type ForecastSeries = ForecastPoint[];

/**
 * Строка таблицы факторов (UI-формат)
 */
export interface ExplainRow {
  /** Название фактора */
  name: string;
  /** Влияние на прогноз (может быть позитивным/негативным) */
  impact: number;
  /** SHAP значение (опционально в UI) */
  shap?: number;
  /** Уверенность модели в этом факторе */
  conf?: number;
}

export interface ForecastMeta {
  /** Время выполнения (мс) */
  runtime_ms: number;
  /** Какой backend/воркер считал (например, 'local', 'cloud', 'mock') */
  backend: string;
  /** Версия модели (например, 'xgb-1.2.3') */
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
