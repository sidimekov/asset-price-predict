export type HistoryEntry = {
  id: string;
  created_at: string;

  symbol: string;
  tf: string;
  horizon: number;
  provider: string;

  p50: Array<[number, number]>;
  p10?: Array<[number, number]>;
  p90?: Array<[number, number]>;

  explain?: Array<{
    name: string;
    group: string;
    impact_abs: number;
    sign: '+' | '-';
    shap?: number;
    confidence?: number;
  }>;

  meta: {
    runtime_ms: number;
    backend: 'client' | 'server';
    model_ver?: string;
  };
};
