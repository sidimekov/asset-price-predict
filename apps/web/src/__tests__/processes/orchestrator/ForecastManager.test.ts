import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Bar } from '@assetpredict/shared';

vi.mock('@/features/market-adapter/MarketAdapter', () => ({
  getTimeseries: vi.fn(),
}));

vi.mock('@/processes/orchestrator/mlWorkerClient', () => ({
  inferForecast: vi.fn(),
}));

import { ForecastManager, type OrchestratorInput } from '@/processes/orchestrator/ForecastManager';
import {
  setLocalTimeseries,
  getLocalTimeseries,
  setLocalForecast,
  getLocalForecast,
  orchestratorState,
} from '@/processes/orchestrator/state';
import { makeTimeseriesKey, makeForecastKey } from '@/processes/orchestrator/keys';
import { getTimeseries } from '@/features/market-adapter/MarketAdapter';
import { inferForecast } from '@/processes/orchestrator/mlWorkerClient';

const mockDispatch = vi.fn();
const mockGetState = vi.fn(() => ({} as any));

describe('ForecastManager', () => {
  const getTimeseriesMock = getTimeseries as unknown as vi.Mock;
  const inferForecastMock = inferForecast as unknown as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestratorState.status = 'idle';
  });

  const baseCtx: OrchestratorInput = {
    symbol: 'SBER' as any,
    provider: 'MOCK',
    tf: '1h',
    window: 200,
    horizon: 24,
    model: null,
  };

  const deps = {
    dispatch: mockDispatch,
    getState: mockGetState,
    signal: undefined,
  };

  it('uses local timeseries cache when fresh, without calling MarketAdapter', async () => {
    const bars: Bar[] = [
      [0, 1, 2, 0.5, 1.5, 100],
      [1, 1.5, 2.5, 1, 2, 120],
    ];

    const tsKey = makeTimeseriesKey({
      provider: baseCtx.provider,
      symbol: baseCtx.symbol,
      tf: baseCtx.tf,
      window: baseCtx.window,
    });

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

    await ForecastManager.run(baseCtx, deps);

    expect(getTimeseriesMock).not.toHaveBeenCalled();
    expect(inferForecastMock).toHaveBeenCalledTimes(1);
    expect(orchestratorState.status).toBe('idle');
  });

  it('calls MarketAdapter.getTimeseries when no local timeseries, then caches them', async () => {
    const ctxNoCache: OrchestratorInput = {
      ...baseCtx,
      symbol: 'GAZP' as any,
    };

    getTimeseriesMock.mockResolvedValue({
      bars: [
        [0, 1, 2, 0.5, 1.5, 100],
        [1, 1.5, 2.5, 1, 2, 120],
      ],
      symbol: 'GAZP',
      provider: 'MOCK',
      timeframe: '1h',
      source: 'MOCK',
    });

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

    await ForecastManager.run(ctxNoCache, deps);

    expect(getTimeseriesMock).toHaveBeenCalledTimes(1);

    const tsKey = makeTimeseriesKey({
      provider: ctxNoCache.provider,
      symbol: ctxNoCache.symbol,
      tf: ctxNoCache.tf,
      window: ctxNoCache.window,
    });
    const entry = getLocalTimeseries(tsKey);
    expect(entry).toBeDefined();
    expect(entry?.bars.length).toBe(2);

    const fcKey = makeForecastKey({
      symbol: ctxNoCache.symbol,
      tf: ctxNoCache.tf,
      horizon: ctxNoCache.horizon,
      model: ctxNoCache.model || undefined,
    });
    const forecast = getLocalForecast(fcKey);
    expect(forecast).toBeDefined();
    expect(forecast?.series.p50).toEqual([1, 2]);
  });


  it('uses cached forecast when present and does not call inferForecast again', async () => {
    const bars: Bar[] = [
      [0, 1, 2, 0.5, 1.5, 100],
      [1, 1.5, 2.5, 1, 2, 120],
    ];

    const tsKey = makeTimeseriesKey({
      provider: baseCtx.provider,
      symbol: baseCtx.symbol,
      tf: baseCtx.tf,
      window: baseCtx.window,
    });
    setLocalTimeseries(tsKey, bars);

    const fcKey = makeForecastKey({
      symbol: baseCtx.symbol,
      tf: baseCtx.tf,
      horizon: baseCtx.horizon,
      model: baseCtx.model || undefined,
    });
    setLocalForecast(fcKey, {
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
    });

    await ForecastManager.run(baseCtx, deps);

    expect(getTimeseriesMock).not.toHaveBeenCalled();
    expect(inferForecastMock).not.toHaveBeenCalled();
    expect(orchestratorState.status).toBe('idle');
  });

  it('does not proceed to inference when MarketAdapter throws', async () => {
    const ctxError: OrchestratorInput = {
      ...baseCtx,
      symbol: 'ERR' as any,
    };

    getTimeseriesMock.mockRejectedValue(new Error('fail'));

    await expect(ForecastManager.run(ctxError, deps)).rejects.toThrow('fail');

    // адаптер вызвали
    expect(getTimeseriesMock).toHaveBeenCalledTimes(1);
    // воркер не трогали
    expect(inferForecastMock).not.toHaveBeenCalled();

    const fcKey = makeForecastKey({
      symbol: ctxError.symbol,
      tf: ctxError.tf,
      horizon: ctxError.horizon,
      model: ctxError.model || undefined,
    });
    const forecast = getLocalForecast(fcKey);
    // прогноз в кэш не записан
    expect(forecast).toBeUndefined();
  });


  expect(ForecastManager.run(baseCtx, deps)).rejects.toThrow('fail');
});
