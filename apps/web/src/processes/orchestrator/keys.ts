import type { Timeframe, Symbol } from '@assetpredict/shared';
import type { Provider } from '@assetpredict/shared';

export function makeTimeseriesKey(params: {
  provider: Provider | string;
  symbol: Symbol;
  tf: Timeframe;
  window: string | number;
}): string {
  const { provider, symbol, tf, window } = params;
  return `${provider}:${symbol}:${tf}:${window}`;
}

export function makeForecastKey(params: {
  symbol: Symbol;
  tf: Timeframe;
  horizon: number;
  model?: string | null;
}): string {
  const { symbol, tf, horizon, model } = params;
  return `${symbol}:${tf}:h${horizon}:m${model || 'client'}`;
}
