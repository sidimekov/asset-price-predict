import type { Bar, Symbol, Timeframe, Provider } from '@assetpredict/shared';

export type MarketAdapterRequest = {
  symbol: Symbol;
  provider?: Provider | string;
  timeframe?: Timeframe;
  limit?: number;
  signal?: AbortSignal;
};

export type MarketAdapterResponse = {
  bars: Bar[];
  symbol: Symbol;
  provider: Provider | string;
  timeframe: Timeframe;
  source: 'MOCK';
};

/**
 * временная мок реализация Market Adapter
 */
export async function getTimeseries(
  req: MarketAdapterRequest,
): Promise<MarketAdapterResponse> {
  const {
    symbol,
    provider = 'MOCK',
    timeframe = '1h' as Timeframe,
    limit = 200,
  } = req;

  const now = Date.now();
  const bars: Bar[] = Array.from({ length: limit }).map((_, idx) => {
    const ts = now - (limit - idx) * 60 * 60 * 1000; // шаг 1h для примера
    const base = 100 + Math.sin(idx / 10) * 5;
    const o = base;
    const c = base + (Math.random() - 0.5);
    const h = Math.max(o, c) + Math.random();
    const l = Math.min(o, c) - Math.random();
    const v = 1000 + Math.random() * 100;
    return [ts, o, h, l, c, v];
  });

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[MarketAdapter] MOCK timeseries', {
      symbol,
      provider,
      timeframe,
      limit,
    });
  }

  return {
    bars,
    symbol,
    provider,
    timeframe,
    source: 'MOCK',
  };
}
