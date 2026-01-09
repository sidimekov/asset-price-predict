/* global AbortSignal */

import type { Symbol, Bar } from '@assetpredict/shared';
import { makeForecastKey } from './keys';
import { orchestratorState, TIMESERIES_TTL_MS } from './state';

import type { RootState, AppDispatch } from '@/shared/store';
import { getMarketTimeseries } from '@/features/market-adapter/MarketAdapter';
import type { MarketDataProvider, MarketTimeframe } from '@/config/market';

import { inferForecast } from './mlWorkerClient';

import {
  forecastRequested,
  forecastReceived,
  forecastFailed,
  forecastCancelled,
} from '@/entities/forecast/model/forecastSlice';

import {
  timeseriesRequested,
  timeseriesReceived,
  timeseriesFailed,
  buildTimeseriesKey,
  isTimeseriesStaleByKey,
} from '@/entities/timeseries/model/timeseriesSlice';

export type OrchestratorInput = {
  symbol: Symbol;
  provider: MarketDataProvider | 'MOCK';
  tf: MarketTimeframe;
  window: number;
  horizon: number;
  model?: string | null;
};

type OrchestratorDeps = {
  dispatch: AppDispatch;
  getState: () => RootState;
  signal?: AbortSignal;
};

function isAbortError(err: any): boolean {
  return err?.name === 'AbortError' || err?.code === 'ABORTED';
}

/**
 * ForecastManager - центр оркестратора
 * Таймсерии: через timeseriesSlice + MarketAdapter
 * Прогноз: через ML воркер, результат в forecastSlice
 */
export class ForecastManager {
  static async run(ctx: OrchestratorInput, deps: OrchestratorDeps): Promise<void> {
    const { symbol, provider, tf, window, horizon, model } = ctx;
    const { dispatch, getState, signal } = deps;

    // ключ таймсерии должен учитывать window/limit
    const tsKey = buildTimeseriesKey(provider as any, symbol, tf, window);

    const fcKey = makeForecastKey({
      symbol,
      tf,
      horizon,
      model: model || undefined,
    });

    orchestratorState.status = 'running';

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Orchestrator] run', {
        symbol,
        provider,
        tf,
        window,
        horizon,
        model,
        tsKey,
        fcKey,
      });
    }

    // старт прогноза
    dispatch(forecastRequested(fcKey));

    try {
      // 1) ensure timeseries
      const bars = await ForecastManager.ensureTimeseries(
        { tsKey, symbol, provider, tf, window },
        { dispatch, getState, signal },
      );

      if (signal?.aborted) {
        dispatch(forecastCancelled(fcKey));
        return;
      }

      const lastTs = bars.length ? bars[bars.length - 1][0] : Date.now();

      // 2) tail for worker
      const tail = ForecastManager.buildTailForWorker(bars, horizon);

      // 3) infer (with abort)
      const inferResult = await inferForecast(tail, horizon, model ?? undefined, {
        signal,
      });

      if (signal?.aborted) {
        dispatch(forecastCancelled(fcKey));
        return;
      }

      // 4) store entry
      const storeEntry = ForecastManager.buildStoreForecastEntry(
        {
          series: {
            p10: inferResult.p10 ?? [],
            p50: inferResult.p50 ?? [],
            p90: inferResult.p90 ?? [],
          },
          meta: inferResult.diag as any,
        },
        tf,
        lastTs,
      );

      dispatch(
        forecastReceived({
          key: fcKey,
          entry: storeEntry,
        }),
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Orchestrator] forecast ready', {
          fcKey,
          horizon,
          points: inferResult.p50.length,
        });
      }
    } catch (err: any) {
      if (signal?.aborted || isAbortError(err)) {
        dispatch(forecastCancelled(fcKey));
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Orchestrator] aborted', { fcKey });
        }
        return;
      }

      const message = err?.message || 'Failed to run forecast orchestrator';
      orchestratorState.status = 'error';

      if (process.env.NODE_ENV !== 'production') {
        console.error('[Orchestrator] forecast error', {
          fcKey,
          message,
        });
      }

      dispatch(
        forecastFailed({
          key: fcKey,
          error: message,
        }),
      );
      // ВАЖНО: больше не throw наружу
    } finally {
      if (orchestratorState.status !== 'error') {
        orchestratorState.status = 'idle';
      }
    }
  }

  private static async ensureTimeseries(
    args: {
      tsKey: string;
      symbol: Symbol;
      provider: MarketDataProvider | 'MOCK';
      tf: MarketTimeframe;
      window: number;
    },
    deps: OrchestratorDeps,
  ): Promise<Bar[]> {
    const { tsKey, symbol, provider, tf, window } = args;
    const { dispatch, getState, signal } = deps;

    // 0) check store cache + TTL
    const state = getState();
    const isStale = isTimeseriesStaleByKey(state, tsKey as any, TIMESERIES_TTL_MS);

    const entry = (state as any).timeseries?.byKey?.[tsKey] as
      | { bars: Bar[]; fetchedAt: string }
      | undefined;

    if (entry && !isStale) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Orchestrator] using store timeseries cache', { tsKey });
      }
      return entry.bars;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Orchestrator] loading timeseries with MarketAdapter', {
        tsKey,
        symbol,
        provider,
        tf,
        window,
      });
    }

    dispatch(timeseriesRequested({ key: tsKey as any }));

    const adapterRes = await getMarketTimeseries(
      dispatch,
      {
        symbol,
        provider,
        timeframe: tf,
        limit: window,
      } as any,
      { signal },
    );

    if ('code' in adapterRes) {
      const message = adapterRes.message || 'Failed to load timeseries';
      dispatch(timeseriesFailed({ key: tsKey as any, error: message }));
      throw new Error(message);
    }

    dispatch(
      timeseriesReceived({
        key: tsKey as any,
        bars: adapterRes.bars as any,
      }),
    );

    return adapterRes.bars as any;
  }

  private static buildTailForWorker(
    bars: Bar[],
    horizon: number,
  ): Array<[number, number]> {
    if (!bars.length) return [];
    const tailSize = Math.max(horizon * 2, 128);
    const slice = bars.slice(-tailSize);

    // Bar = [ts(ms), o, h, l, c, v?]
    return slice.map((b) => [b[0], b[4]] as [number, number]);
  }

  private static buildStoreForecastEntry(
    entry: { series: { p10: number[]; p50: number[]; p90: number[] }; meta: any },
    tf: MarketTimeframe,
    lastTs: number,
  ) {
    const stepMs = ForecastManager.timeframeToMs(tf);

    const makeSeries = (values: number[]) =>
      values.map((value, index) => {
        const ts = lastTs + stepMs * (index + 1);
        return [ts, value] as [number, number];
      });

    const { series, meta } = entry;

    return {
      p50: makeSeries(series.p50),
      p10: series.p10?.length ? makeSeries(series.p10) : undefined,
      p90: series.p90?.length ? makeSeries(series.p90) : undefined,
      meta,
    };
  }

  private static timeframeToMs(tf: MarketTimeframe): number {
    switch (tf) {
      case '1h':
        return 60 * 60 * 1000;
      case '8h':
        return 8 * 60 * 60 * 1000;
      case '1d':
        return 24 * 60 * 60 * 1000;
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      case '1mo':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }
}
