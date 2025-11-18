export type LocalHistoryExplainItem = {
  name: string;
  group: string;
  impact_abs: number;
  sign: '+' | '-';
  shap?: number;
  confidence?: number;
};

export type LocalHistoryMeta = {
  runtime_ms: number;
  backend: string;
};

export type LocalHistoryEntry = {
  id: string; // UUID прогноза на клиенте
  created_at: string; // ISO timestamp
  symbol: string;
  tf: string;
  horizon: number;
  provider: string;
  p50: Array<[number, number]>;
  p10?: Array<[number, number]>;
  p90?: Array<[number, number]>;
  explain: LocalHistoryExplainItem[];
  meta: LocalHistoryMeta;
};

export type LocalHistoryList = LocalHistoryEntry[];
