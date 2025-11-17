import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Bar } from '@assetpredict/shared';
import {
  ForecastManager,
  type OrchestratorInput,
} from '@/processes/orchestrator/ForecastManager';
import {
  setLocalTimeseries,
  getLocalTimeseries,
  setLocalForecast,
  getLocalForecast,
  orchestratorState,
} from '@/processes/orchestrator/state';

// мокаем MarketAdapter и mlWorkerClient
vi.mock('@/features/market-adapter/MarketAdapter', () => ({
  getMarketTimeseries: vi.fn(),
}));

vi.mock('../mlWorkerClient', () => ({
  inferForecast: vi.fn(),
}));

import { getTimeseries as getMarketTimeseries } from '@/features/marker-adapter/MarketAdapter';
import { inferForecast } from '@/processes/orchestrator/mlWorkerClient';

const mockDispatch = vi.fn();
const mockGetState = vi.fn(() => ({}) as any);

describe('ForecastManager', () => {
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

    // формируем ключ почти так же как makeTimeseriesKey
    const tsKey = 'MOCK:SBER:1h:200';
    setLocalTimeseries(tsKey, bars);

    (inferForecast as any).mockResolvedValue({
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

    expect(getMarketTimeseries).not.toHaveBeenCalled();
    expect(inferForecast).toHaveBeenCalledTimes(1);
    expect(orchestratorState.status).toBe('idle');
  });

  it('calls MarketAdapter when no local timeseries, then caches them', async () => {
    (getMarketTimeseries as any).mockResolvedValue({
      bars: [
        [0, 1, 2, 0.5, 1.5, 100],
        [1, 1.5, 2.5, 1, 2, 120],
      ],
      symbol: 'SBER',
      provider: 'MOCK',
      timeframe: '1h',
      source: 'NETWORK',
    });

    (inferForecast as any).mockResolvedValue({
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

    expect(getMarketTimeseries).toHaveBeenCalledTimes(1);

    const tsKey = 'MOCK:SBER:1h:200';
    const entry = getLocalTimeseries(tsKey);
    expect(entry).toBeDefined();
    expect(entry?.bars.length).toBe(2);

    const fcKey = 'SBER:1h:h24:mclient';
    const forecast = getLocalForecast(fcKey);
    expect(forecast).toBeDefined();
    expect(forecast?.series.p50).toEqual([1, 2]);
  });

  it('uses cached forecast when present and does not call inferForecast again', async () => {
    const bars: Bar[] = [
      [0, 1, 2, 0.5, 1.5, 100],
      [1, 1.5, 2.5, 1, 2, 120],
    ];
    const tsKey = 'MOCK:SBER:1h:200';
    setLocalTimeseries(tsKey, bars);

    const fcKey = 'SBER:1h:h24:mclient';
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

    expect(getMarketTimeseries).not.toHaveBeenCalled();
    expect(inferForecast).not.toHaveBeenCalled();
    expect(orchestratorState.status).toBe('idle');
  });

  it('throws if MarketAdapter returns error-like result', async () => {
    (getMarketTimeseries as any).mockResolvedValue({
      code: 'PROVIDER_ERROR',
      message: 'fail',
    });

    await expect(ForecastManager.run(baseCtx, deps)).rejects.toThrow('fail');
  });
});
