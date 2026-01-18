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

vi.mock('@/entities/history/repository', () => ({
  historyRepository: {
    list: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

import {
  ForecastManager,
  type OrchestratorInput,
} from '@/processes/orchestrator/ForecastManager';
import {
  orchestratorState,
  TIMESERIES_TTL_MS,
} from '@/processes/orchestrator/state';
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
import { historyRepository } from '@/entities/history/repository';

// @ts-ignore
const getMarketTimeseriesMock = getMarketTimeseries as unknown as vi.Mock;
// @ts-ignore
const inferForecastMock = inferForecast as unknown as vi.Mock;
const historySaveMock = historyRepository.save as unknown as vi.Mock;

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
    expect(historySaveMock).toHaveBeenCalledTimes(1);

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
    expect(historySaveMock).toHaveBeenCalledTimes(1);

    expect(orchestratorState.status).toBe('idle');
  });

  it('continues when history save fails: forecast is stored, no forecastFailed', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'HISTSAVE' as any,
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
        byKey: { [tsKey]: { bars, fetchedAt: new Date().toISOString() } },
      },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    inferForecastMock.mockResolvedValue({
      p50: [10, 20],
      p10: [9, 19],
      p90: [11, 21],
      diag: { runtime_ms: 10, backend: 'mock', model_ver: 'v1' },
    });

    historySaveMock.mockRejectedValueOnce(new Error('history down'));

    await ForecastManager.run(ctx, makeDeps());

    expect(forecastReceived).toHaveBeenCalledTimes(1);
    expect(forecastFailed).not.toHaveBeenCalled();
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
    expect(timeseriesFailed).toHaveBeenCalledWith({
      key: tsKey,
      error: 'fail',
    });
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
    expect(historySaveMock).not.toHaveBeenCalled();
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
    expect(historySaveMock).not.toHaveBeenCalled();
  });

  it('state.ts is minimal: exports TTL and orchestratorState', () => {
    expect(typeof TIMESERIES_TTL_MS).toBe('number');
    expect(orchestratorState).toBeDefined();
    expect(['idle', 'running', 'error']).toContain(orchestratorState.status);
  });
  it('recomputes forecast even if forecast already exists in store (current behavior)', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'CACHED' as any,
      provider: 'MOEX' as any,
      tf: '1h',
      window: 200,
      horizon: 2,
      model: null,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(false);

    const bars: Bar[] = [[1_000_000, 1, 2, 0.5, 1.5, 100]];

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    // forecast уже есть, но ожидаем, что run пересчитает
    mockGetState.mockReturnValue({
      timeseries: {
        byKey: { [tsKey]: { bars, fetchedAt: new Date().toISOString() } },
      },
      forecast: {
        byKey: {
          [fcKey]: {
            p50: [[2_000_000, 123]],
            meta: { runtime_ms: 1, backend: 'local', model_ver: 'x' },
          },
        },
        loadingByKey: {},
        errorByKey: {},
      },
    } as any);

    inferForecastMock.mockResolvedValue({
      p50: [10, 20],
      p10: [9, 19],
      p90: [11, 21],
      diag: { runtime_ms: 10, backend: 'mock', model_ver: 'v1' },
    });

    await ForecastManager.run(ctx, makeDeps());

    expect(inferForecastMock).toHaveBeenCalledTimes(1);
    expect(forecastReceived).toHaveBeenCalledTimes(1);
  });

  it('handles inferForecast throw: dispatches forecastFailed, no history save, no throw outward', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'INFERR' as any,
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
        byKey: { [tsKey]: { bars, fetchedAt: new Date().toISOString() } },
      },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    inferForecastMock.mockRejectedValue(new Error('infer boom'));

    await ForecastManager.run(ctx, makeDeps());

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    expect(forecastFailed).toHaveBeenCalledWith({
      key: fcKey,
      error: 'infer boom',
    });

    expect(historySaveMock).not.toHaveBeenCalled();
    expect(orchestratorState.status).toBe('error');
  });
  it('ensureTimeseriesOnly loads timeseries when stale and does not touch forecast', async () => {
    const ctx = {
      symbol: 'TSONLY' as any,
      provider: 'MOEX' as any,
      tf: '1h' as any,
      window: 200,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(true);

    mockGetState.mockReturnValue({
      timeseries: { byKey: {} },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    const bars: Bar[] = [[1_000_000, 1, 2, 0.5, 1.5, 100]];

    getMarketTimeseriesMock.mockResolvedValue({
      bars,
      symbol: ctx.symbol,
      provider: ctx.provider,
      timeframe: ctx.tf,
      source: 'NETWORK',
    });

    await ForecastManager.ensureTimeseriesOnly(ctx as any, makeDeps());

    expect(timeseriesRequested).toHaveBeenCalledWith({ key: tsKey });
    expect(timeseriesReceived).toHaveBeenCalledWith({ key: tsKey, bars });

    // forecast не трогаем
    expect(forecastRequested).not.toHaveBeenCalled();
    expect(inferForecastMock).not.toHaveBeenCalled();
    expect(historySaveMock).not.toHaveBeenCalled();
  });
  it('treats MarketAdapter ABORTED as cancellation: no forecastFailed, no infer', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'ABRT2' as any,
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
      code: 'ABORTED',
      message: 'aborted',
    });

    await ForecastManager.run(ctx, makeDeps());

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    expect(forecastCancelled).toHaveBeenCalledWith(fcKey);
    expect(forecastFailed).not.toHaveBeenCalled();
    expect(inferForecastMock).not.toHaveBeenCalled();
    expect(historySaveMock).not.toHaveBeenCalled();
    expect(orchestratorState.status).toBe('idle');
  });

  it('builds tail size at least 128 for inference (branch: max(h*2,128))', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'TAIL128' as any,
      provider: 'MOEX' as any,
      tf: '1h',
      window: 300,
      horizon: 2, // h*2=4, значит должно быть 128
      model: null,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(false);

    const bars: Bar[] = Array.from({ length: 200 }, (_, i) => {
      const ts = 1_000_000 + i * 60_000;
      return [ts, 1, 2, 0.5, 1.5 + i, 100] as any;
    });

    mockGetState.mockReturnValue({
      timeseries: {
        byKey: { [tsKey]: { bars, fetchedAt: new Date().toISOString() } },
      },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    inferForecastMock.mockResolvedValue({
      p50: [1, 2],
      p10: [],
      p90: [],
      diag: { runtime_ms: 1, backend: 'mock', model_ver: 'v' },
    });

    await ForecastManager.run(ctx, makeDeps());

    expect(inferForecastMock).toHaveBeenCalledTimes(1);
    const [tailArg] = inferForecastMock.mock.calls[0];
    expect(Array.isArray(tailArg)).toBe(true);
    expect(tailArg.length).toBe(128);
  });
  it('handles empty bars -> inferForecast throws -> forecastFailed and status error', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'EMPTY' as any,
      provider: 'MOEX' as any,
      tf: '1h',
      window: 200,
      horizon: 2,
      model: null,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(false);

    mockGetState.mockReturnValue({
      timeseries: {
        byKey: { [tsKey]: { bars: [], fetchedAt: new Date().toISOString() } },
      },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    // inferForecast при пустом tail обычно кидает (в зависимости от реализации)
    inferForecastMock.mockRejectedValue(
      new Error('Invalid tail or horizon for inference'),
    );

    await ForecastManager.run(ctx, makeDeps());

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    expect(forecastFailed).toHaveBeenCalledWith({
      key: fcKey,
      error: 'Invalid tail or horizon for inference',
    });

    expect(historySaveMock).not.toHaveBeenCalled();
    expect(orchestratorState.status).toBe('error');
  });
  // it('does not call inferForecast if forecast already exists in store', async () => {
  //   const ctx: OrchestratorInput = {
  //     symbol: 'CACHED' as any,
  //     provider: 'MOEX' as any,
  //     tf: '1h',
  //     window: 200,
  //     horizon: 2,
  //     model: null,
  //   };
  //
  //   const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
  //   (buildTimeseriesKey as any).mockReturnValue(tsKey);
  //   (isTimeseriesStaleByKey as any).mockReturnValue(false);
  //
  //   const bars: Bar[] = [[1_000_000, 1, 2, 0.5, 1.5, 100]];
  //
  //   const fcKey = makeForecastKey({
  //     symbol: ctx.symbol,
  //     tf: ctx.tf,
  //     horizon: ctx.horizon,
  //     model: ctx.model ?? undefined,
  //   });
  //
  //   mockGetState.mockReturnValue({
  //     timeseries: {
  //       byKey: { [tsKey]: { bars, fetchedAt: new Date().toISOString() } },
  //     },
  //     forecast: {
  //       byKey: {
  //         [fcKey]: {
  //           p50: [[2_000_000, 123]],
  //           meta: { runtime_ms: 1, backend: 'local', model_ver: 'x' },
  //         },
  //       },
  //       loadingByKey: {},
  //       errorByKey: {},
  //     },
  //   } as any);
  //
  //   await ForecastManager.run(ctx, makeDeps());
  //
  //   expect(inferForecastMock).not.toHaveBeenCalled();
  //   expect(forecastReceived).toHaveBeenCalledTimes(1);
  //   expect(historySaveMock).not.toHaveBeenCalled();
  //   expect(orchestratorState.status).toBe('idle');
  // });
  it('treats inferForecast AbortError as cancellation', async () => {
    const ctx: OrchestratorInput = {
      symbol: 'ABRT_INF' as any,
      provider: 'MOEX' as any,
      tf: '1h',
      window: 200,
      horizon: 2,
      model: null,
    };

    const tsKey = `${ctx.provider}:${ctx.symbol}:${ctx.tf}:${ctx.window}`;
    (buildTimeseriesKey as any).mockReturnValue(tsKey);
    (isTimeseriesStaleByKey as any).mockReturnValue(false);

    const bars: Bar[] = [[1_000_000, 1, 2, 0.5, 1.5, 100]];

    mockGetState.mockReturnValue({
      timeseries: {
        byKey: { [tsKey]: { bars, fetchedAt: new Date().toISOString() } },
      },
      forecast: { byKey: {}, loadingByKey: {}, errorByKey: {} },
    } as any);

    const e = new Error('Aborted');
    (e as any).name = 'AbortError';
    inferForecastMock.mockRejectedValue(e);

    await ForecastManager.run(ctx, makeDeps());

    const fcKey = makeForecastKey({
      symbol: ctx.symbol,
      tf: ctx.tf,
      horizon: ctx.horizon,
      model: ctx.model ?? undefined,
    });

    expect(forecastCancelled).toHaveBeenCalledWith(fcKey);
    expect(forecastFailed).not.toHaveBeenCalled();
    expect(historySaveMock).not.toHaveBeenCalled();
    expect(orchestratorState.status).toBe('idle');
  });
});
