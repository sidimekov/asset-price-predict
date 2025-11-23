import type { MarketDataProvider, MarketTimeframe } from '@/config/market';

export function makeTimeseriesKey(params: {
  provider: MarketDataProvider | 'MOCK';
  symbol: string;
  tf: MarketTimeframe;
  window: number;
}): string {
  return `${params.provider}:${params.symbol}:${params.tf}:${params.window}`;
}

export function makeForecastKey(params: {
  symbol: string;
  tf: MarketTimeframe;
  horizon: number;
  model?: string | null;
}): string {
  const modelPart = params.model ?? 'client';
  return `${params.symbol}:${params.tf}:h${params.horizon}:m${modelPart}`;
}
