/* global AbortSignal */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Bar } from '@assetpredict/shared';

// --- mocks ---

vi.mock('@/features/market-adapter/MarketAdapter', () => ({
  getMarketTimeseries: vi.fn(),
}));

vi.mock('@/processes/orchestrator/mlWorkerClient', () => ({
  inferForecast: vi.fn(),
}));

// ForecastManager теперь читает/пишет через slices
// Мокаем action creators и helpers, чтобы тест был unit-level
vi.mock('@/entities/timeseries/model/timeseriesSlice', () => {
  return {
    buildTimeseriesKey: vi.fn(
      (provider: string, symbol: string, tf: string, limit: number) =>
        `${provider}:${symbol}:${tf}:${limit}`,
    ),
    isTimeseriesStaleByKey: vi.fn(),
    timeseriesRequested: vi.fn((payload: any) => ({
      type: 'timeseries/requested',
      payload,
    })),
    timeseriesReceived: vi.fn((payload: any) => ({
      type: 'timeseries/received',
      payload,
    })),
    timeseriesFailed: vi.fn((payload: any) => ({
      type: 'timeseries/failed',
      payload,
    })),
  };
});

vi.mock('@/entities/forecast/model/forecastSlice', () => {
  return {
    forecastRequested: vi.fn((key: string) => ({
      type: 'forecast/requested',
      payload: key,
    })),
    forecastReceived: vi.fn((payload: any) => ({
      type: 'forecast/received',
      payload,
    })),
    forecastFailed: vi.fn((payload: any) => ({
      type: 'forecast/failed',
      payload,
    })),
    forecastCancelled: vi.fn((key: string) => ({
      type: 'forecast/cancelled',
      payload: key,
    })),
  };
});

import { ForecastManager, type OrchestratorInput } from '@/processes/orchestrator/ForecastManager';
import { orchestratorState, TIMESERIES_TTL_MS } from '@/processes/orchestrator/state';
import { makeForecastKey } from '@/processes/orchestrator/keys';

import { getMarketTimeseries } from '@/features/market-adapter/MarketAdapter';
import { inferForecast } from '@/processes/orchestrator/mlWorkerClient';

import {
  buildTimeseriesKey,
  isTimeseriesStaleByKey,
  timeseriesRequested,
  timeseriesReceived,
  timeseriesFailed,
} from '@/entities/timeseries/model/timeseriesSlice';

import {
  forecastRequested,
  forecastReceived,
  forecastFailed,
  forecastCancelled,
} from '@/entities/forecast/model/forecastSlice';

// @ts-ignore
const getMarketTimeseriesMock = getMarketTimeseries as unknown as vi.Mock;
// @ts-ignore
const inferForecastMock = inferForecast as unknown as vi.Mock;

const mockDispatch = vi.fn();
const mockGetState = vi.fn(() => ({}) as any);

const makeDeps = (signal?: AbortSignal) => ({
  dispatch: mockDispatch,
  getState: mockGetState,
  signal,
});

describe('ForecastManager (new orchestrator)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orchestratorState.status = 'idle';
  });

  it('uses timeseries from store when fresh (no MarketAdapter call), then calls inferForecast and stores forecast', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'SBER' as any,
      provider: 'MOEX' as any,
      tf: '1h',
      window: 200,
      horizon: 2,
      model: null,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(false);

    const bars: Bar[] = [
      [1_000_000, 1, 2, 0.5, 1.5, 100],
      [2_000_000, 1.5, 2.5, 1, 2, 120],
    ];

    mockGetState.mockReturnValue({
      timeseries: {
        byKey: {
          [tsKey]: { bars, fetchedAt: new Date().toISOString() },
        },
      },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    inferForecastMock.mockResolvedValue({
      p50: [10, 20],
      p10: [9, 19],
      p90: [11, 21],
      diag: { runtime_ms: 10, backend: 'mock', model_ver: 'v1' },
    });

    await ForecastManager.run(ctx, makeDeps());

    // no network timeseries
    expect(getMarketTimeseriesMock).not.toHaveBeenCalled();
    expect(timeseriesRequested).not.toHaveBeenCalled();
    expect(timeseriesReceived).not.toHaveBeenCalled();

    // forecast actions
    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    expect(forecastRequested).toHaveBeenCalledWith(fcKey);
    expect(inferForecastMock).toHaveBeenCalledTimes(1);
    expect(forecastReceived).toHaveBeenCalledTimes(1);

    // status back to idle
    expect(orchestratorState.status).toBe('idle');
  });

  it('loads timeseries via MarketAdapter when missing/stale, dispatches timeseries actions, then infers and stores forecast', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'GAZP' as any,
      provider: 'MOEX' as any,
      tf: '1h',
      window: 200,
      horizon: 2,
      model: null,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(true);

    mockGetState.mockReturnValue({
      timeseries: { byKey: {} },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    const bars: Bar[] = [
      [1_000_000, 1, 2, 0.5, 1.5, 100],
      [2_000_000, 1.5, 2.5, 1, 2, 120],
    ];

    getMarketTimeseriesMock.mockResolvedValue({
      bars,
      symbol: ctx.symbol,
      provider: ctx.provider,
      timeframe: ctx.tf,
      source: 'NETWORK',
    });

    inferForecastMock.mockResolvedValue({
      p50: [1, 2],
      p10: [0.9, 1.9],
      p90: [1.1, 2.1],
      diag: { runtime_ms: 12, backend: 'mock', model_ver: 'v2' },
    });

    await ForecastManager.run(ctx, makeDeps());

    // timeseries flow
    expect(timeseriesRequested).toHaveBeenCalledWith({ key: tsKey });
    expect(getMarketTimeseriesMock).toHaveBeenCalledTimes(1);
    expect(getMarketTimeseriesMock).toHaveBeenCalledWith(
      mockDispatch,
      expect.objectContaining({
        symbol: ctx.symbol,
        provider: ctx.provider,
        timeframe: ctx.tf,
        limit: ctx.window,
      }),
      expect.objectContaining({ signal: undefined }),
    );

    expect(timeseriesReceived).toHaveBeenCalledWith({
      key: tsKey,
      bars,
    });

    // forecast flow
    expect(inferForecastMock).toHaveBeenCalledTimes(1);
    expect(forecastReceived).toHaveBeenCalledTimes(1);

    expect(orchestratorState.status).toBe('idle');
  });

  it('handles MarketAdapter error (code in response): dispatches timeseriesFailed + forecastFailed and does NOT throw', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'ERR' as any,
      provider: 'MOEX' as any,
      tf: '1h',
      window: 200,
      horizon: 2,
      model: null,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(true);

    mockGetState.mockReturnValue({
      timeseries: { byKey: {} },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    getMarketTimeseriesMock.mockResolvedValue({
      code: 'PROVIDER_ERROR',
      message: 'fail',
    });

    await ForecastManager.run(ctx, makeDeps());

    expect(timeseriesRequested).toHaveBeenCalledWith({ key: tsKey });
    expect(timeseriesFailed).toHaveBeenCalledWith({ key: tsKey, error: 'fail' });
    expect(inferForecastMock).not.toHaveBeenCalled();

    // forecast should fail (no throw)
    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    expect(forecastFailed).toHaveBeenCalledWith({
      key: fcKey,
      error: 'fail',
    });
  });

  it('supports abort: if signal aborted, dispatches forecastCancelled and does not call inferForecast', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'ABRT' as any,
      provider: 'MOEX' as any,
      tf: '1h',
      window: 200,
      horizon: 2,
      model: null,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(true);

    mockGetState.mockReturnValue({
      timeseries: { byKey: {} },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    const ac = new AbortController();
    ac.abort();

    await ForecastManager.run(ctx, makeDeps(ac.signal));

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    expect(forecastCancelled).toHaveBeenCalledWith(fcKey);
    expect(inferForecastMock).not.toHaveBeenCalled();
  });

  it('state.ts is minimal: exports TTL and orchestratorState', () => {
    expect(typeof TIMESERIES_TTL_MS).toBe('number');
    expect(orchestratorState).toBeDefined();
    expect(['idle', 'running', 'error']).toContain(orchestratorState.status);
  });
});
