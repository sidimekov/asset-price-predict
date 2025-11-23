import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Bar } from '@assetpredict/shared';

// Мокаем MarketAdapter и mlWorkerClient
vi.mock('@/features/market-adapter/MarketAdapter', () => ({
  getMarketTimeseries: vi.fn(),
}));

vi.mock('@/processes/orchestrator/mlWorkerClient', () => ({
  inferForecast: vi.fn(),
}));

import { ForecastManager, type OrchestratorInput } from '@/processes/orchestrator/ForecastManager';
import {
  orchestratorState,
  setLocalTimeseries,
  getLocalTimeseries,
  setLocalForecast,
  getLocalForecast,
  type LocalForecastEntry,
} from '@/processes/orchestrator/state';
import { makeTimeseriesKey, makeForecastKey } from '@/processes/orchestrator/keys';
import { getMarketTimeseries } from '@/features/market-adapter/MarketAdapter';
import { inferForecast } from '@/processes/orchestrator/mlWorkerClient';

// @ts-ignore
const getMarketTimeseriesMock = getMarketTimeseries as unknown as vi.Mock;
// @ts-ignore
const inferForecastMock = inferForecast as unknown as vi.Mock;

const mockDispatch = vi.fn();
const mockGetState = vi.fn(() => ({} as any));

const makeDeps = () => ({
  dispatch: mockDispatch,
  getState: mockGetState,
  signal: undefined as AbortSignal | undefined,
});

describe('ForecastManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orchestratorState.status = 'idle';
  });

  it('uses local timeseries cache when fresh and calls inferForecast once', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'SBER1' as any,
      provider: 'MOCK',
      tf: '1h',
      window: 200,
      horizon: 24,
      model: null,
    };

    const tsKey = makeTimeseriesKey({
      provider: ctx.provider,
      symbol: ctx.symbol,
      tf: ctx.tf,
      window: ctx.window,
    });

    const bars: Bar[] = [
      [0, 1, 2, 0.5, 1.5, 100],
      [1, 1.5, 2.5, 1, 2, 120],
    ];
    setLocalTimeseries(tsKey, bars);

    inferForecastMock.mockResolvedValue({
      p50: [1, 2],
      p10: [0.9, 1.9],
      p90: [1.1, 2.1],
      diag: {
        runtime_ms: 10,
        backend: 'mock',
        model_ver: 'mock-v0',
      },
    });

    await ForecastManager.run(ctx, makeDeps());

    expect(getMarketTimeseriesMock).not.toHaveBeenCalled();
    expect(inferForecastMock).toHaveBeenCalledTimes(1);

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    const forecast = getLocalForecast(fcKey);
    expect(forecast).toBeDefined();
    expect(forecast?.series.p50).toEqual([1, 2]);
    expect(orchestratorState.status).toBe('idle');
  });

  it('calls MarketAdapter when no local timeseries, then caches bars and forecast', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'SBER2' as any,
      provider: 'MOCK',
      tf: '1h',
      window: 200,
      horizon: 24,
      model: null,
    };

    const bars: Bar[] = [
      [0, 1, 2, 0.5, 1.5, 100],
      [1, 1.5, 2.5, 1, 2, 120],
    ];

    getMarketTimeseriesMock.mockResolvedValue({
      bars,
      symbol: ctx.symbol,
      provider: ctx.provider,
      timeframe: ctx.tf,
      source: 'NETWORK',
    });

    inferForecastMock.mockResolvedValue({
      p50: [10, 20],
      p10: [9, 19],
      p90: [11, 21],
      diag: {
        runtime_ms: 15,
        backend: 'mock',
        model_ver: 'mock-v1',
      },
    });

    await ForecastManager.run(ctx, makeDeps());

    expect(getMarketTimeseriesMock).toHaveBeenCalledTimes(1);

    const tsKey = makeTimeseriesKey({
      provider: ctx.provider,
      symbol: ctx.symbol,
      tf: ctx.tf,
      window: ctx.window,
    });

    const tsEntry = getLocalTimeseries(tsKey);
    expect(tsEntry).toBeDefined();
    expect(tsEntry?.bars).toEqual(bars);

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    const forecast = getLocalForecast(fcKey);
    expect(forecast).toBeDefined();
    expect(forecast?.series.p50).toEqual([10, 20]);
    expect(orchestratorState.status).toBe('idle');
  });

  it('uses cached forecast when present and does not call inferForecast again', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'SBER3' as any,
      provider: 'MOCK',
      tf: '1h',
      window: 200,
      horizon: 24,
      model: null,
    };

    const tsKey = makeTimeseriesKey({
      provider: ctx.provider,
      symbol: ctx.symbol,
      tf: ctx.tf,
      window: ctx.window,
    });

    const bars: Bar[] = [
      [0, 1, 2, 0.5, 1.5, 100],
      [1, 1.5, 2.5, 1, 2, 120],
    ];
    setLocalTimeseries(tsKey, bars);

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    const entry: LocalForecastEntry = {
      series: {
        p10: [90],
        p50: [100],
        p90: [110],
      },
      meta: {
        runtime_ms: 1,
        backend: 'mock',
        model_ver: 'mock-v0',
      },
    };
    setLocalForecast(fcKey, entry);

    await ForecastManager.run(ctx, makeDeps());

    expect(getMarketTimeseriesMock).not.toHaveBeenCalled();
    expect(inferForecastMock).not.toHaveBeenCalled();

    const forecast = getLocalForecast(fcKey);
    expect(forecast).toBeDefined();
    expect(forecast?.series.p50).toEqual([100]);
    expect(orchestratorState.status).toBe('idle');
  });

  it('propagates errors from MarketAdapter (rejected promise)', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'ERR1' as any,
      provider: 'MOCK',
      tf: '1h',
      window: 200,
      horizon: 24,
      model: null,
    };

    getMarketTimeseriesMock.mockRejectedValue(new Error('fail'));

    await expect(ForecastManager.run(ctx, makeDeps())).rejects.toThrow('fail');

    expect(getMarketTimeseriesMock).toHaveBeenCalledTimes(1);
    expect(inferForecastMock).not.toHaveBeenCalled();

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    const forecast = getLocalForecast(fcKey);
    expect(forecast).toBeUndefined();
  });
});
