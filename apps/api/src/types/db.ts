import type { Timeframe } from '@assetpredict/shared';

export type UserRow = {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
};

export type ForecastRow = {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  horizon: string;
  series: unknown;
  metrics: unknown | null;
  factors: unknown | null;
  provider: string | null;
  model: string | null;
  window: number | null;
  params: unknown | null;
  created_at: Date;
  updated_at: Date;
};

export type ForecastInsert = {
  userId: string;
  symbol: string;
  timeframe: Timeframe;
  horizon: number;
  series: unknown;
  metrics?: unknown | null;
  factors?: unknown | null;
  provider?: string | null;
  model?: string | null;
  window?: number | null;
  params?: unknown | null;
};

export type Pagination = {
  page: number;
  limit: number;
};
