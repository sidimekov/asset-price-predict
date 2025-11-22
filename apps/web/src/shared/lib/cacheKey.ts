import type { MarketDataProvider, MarketTimeframe } from '@/config/market';

export type TimeseriesCacheKey = string;

export type TimeseriesWindow = number | string;

export function buildTimeseriesCacheKey(
    provider: MarketDataProvider,
    symbol: string,
    timeframe: MarketTimeframe,
    window: TimeseriesWindow,
): TimeseriesCacheKey {
    return `${provider}:${symbol}:${timeframe}:${String(window)}`;
}

export interface TimeseriesCacheKeyParams {
    provider: MarketDataProvider;
    symbol: string;
    timeframe: MarketTimeframe;
    window: TimeseriesWindow;
}

export function makeTimeseriesCacheKeyFromParams(
    params: TimeseriesCacheKeyParams,
): TimeseriesCacheKey {
    const { provider, symbol, timeframe, window } = params;
    return buildTimeseriesCacheKey(provider, symbol, timeframe, window);
}