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
  timeseriesCancelled,
  buildTimeseriesKey,
  isTimeseriesStaleByKey,
} from '@/entities/timeseries/model/timeseriesSlice';

import { historyRepository } from '@/entities/history/repository';
import type { HistoryEntry } from '@/entities/history/model';
import { forecastApi } from '@/shared/api/forecast.api';

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

function makeAbortError(): Error & { code?: string } {
  const e: any = new Error('Aborted');
  e.name = 'AbortError';
  e.code = 'ABORTED';
  return e;
}

/**
 * ForecastManager - центр оркестратора
 *  - history (timeseries) можно грузить отдельно
 *  - forecast считается только по trigger (Predict)
 */
export class ForecastManager {
  static async run(
    ctx: OrchestratorInput,
    deps: OrchestratorDeps,
  ): Promise<void> {
    return ForecastManager.runForecast(ctx, deps);
  }

  /**
   * авто-подгрузка таймсерии (без инференса)
   * Используется на Dashboard: выбрали актив - история появилась в timeseriesSlice
   */
  static async ensureTimeseriesOnly(
    ctx: Pick<OrchestratorInput, 'symbol' | 'provider' | 'tf' | 'window'>,
    deps: OrchestratorDeps,
  ): Promise<void> {
    const { symbol, provider, tf, window } = ctx;
    const { dispatch, getState, signal } = deps;

    if (signal?.aborted) return;

    const tsKey = buildTimeseriesKey(provider as any, symbol, tf, window);

    try {
      await ForecastManager.ensureTimeseries(
        { tsKey, symbol, provider, tf, window },
        { dispatch, getState, signal },
      );
    } catch (err: any) {
      if (isAbortError(err) || signal?.aborted) return;
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Orchestrator] ensureTimeseriesOnly error', err);
      }
    }
  }

  /**
   * Model A: прогноз считается только по кнопке Predict
   */
  static async runForecast(
    ctx: OrchestratorInput,
    deps: OrchestratorDeps,
  ): Promise<void> {
    const { symbol, provider, tf, window, horizon, model } = ctx;
    const { dispatch, getState, signal } = deps;

    const tsKey = buildTimeseriesKey(provider as any, symbol, tf, window);
    const fcKey = makeForecastKey({
      symbol,
      tf,
      horizon,
      model: model || undefined,
    });

    orchestratorState.status = 'running';

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Orchestrator] runForecast', {
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
      if (signal?.aborted) {
        dispatch(forecastCancelled(fcKey));
        return;
      }

      // 1) ensure timeseries (из store + TTL; если надо — MarketAdapter)
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
      const inferResult = await inferForecast(
        tail,
        horizon,
        model ?? undefined,
        {
          signal,
        } as any,
      );

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

      try {
        const historyEntry = ForecastManager.buildHistoryEntry(
          {
            id: ForecastManager.generateHistoryId(),
            created_at: new Date().toISOString(),
          },
          {
            symbol,
            tf,
            horizon,
            provider,
          },
          storeEntry,
          inferResult,
        );
        await historyRepository.save(historyEntry);

        if (!signal?.aborted) {
          const backendPayload = {
            symbol,
            timeframe: tf,
            horizon,
            inputUntil: new Date(lastTs).toISOString(),
            model: model ?? 'baseline',
          };
          const request = dispatch(
            forecastApi.endpoints.createForecast.initiate(backendPayload),
          ) as { unwrap: () => Promise<unknown> };

          void request.unwrap().catch((err) => {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[Orchestrator] forecast push failed', err);
            }
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Orchestrator] history save failed', err);
        }
      }

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

    if (signal?.aborted) {
      dispatch(timeseriesCancelled({ key: tsKey as any }));
      throw makeAbortError();
    }

    // 0) check store cache + TTL
    const state = getState();
    const isStale = isTimeseriesStaleByKey(
      state,
      tsKey as any,
      TIMESERIES_TTL_MS,
    );

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

    let adapterRes: Awaited<ReturnType<typeof getMarketTimeseries>>;
    try {
      adapterRes = await getMarketTimeseries(
        dispatch,
        {
          symbol,
          provider,
          timeframe: tf,
          limit: window,
        } as any,
        { signal },
      );
    } catch (err: any) {
      if (isAbortError(err) || signal?.aborted) {
        dispatch(timeseriesCancelled({ key: tsKey as any }));
        throw makeAbortError();
      }
      throw err;
    }

    if (signal?.aborted) {
      dispatch(timeseriesCancelled({ key: tsKey as any }));
      throw makeAbortError();
    }

    if ('code' in adapterRes) {
      const message = adapterRes.message || 'Failed to load timeseries';

      if ((adapterRes as any).code === 'ABORTED') {
        throw makeAbortError();
      }

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
    entry: {
      series: { p10: number[]; p50: number[]; p90: number[] };
      meta: any;
    },
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

  private static buildHistoryEntry(
    base: { id: string; created_at: string },
    ctx: {
      symbol: Symbol;
      tf: MarketTimeframe;
      horizon: number;
      provider: MarketDataProvider | 'MOCK';
    },
    storeEntry: {
      p50: Array<[number, number]>;
      p10?: Array<[number, number]>;
      p90?: Array<[number, number]>;
      meta: any;
    },
    inferResult: { diag: { runtime_ms: number; model_ver?: string } },
  ): HistoryEntry {
    return {
      id: base.id,
      created_at: base.created_at,
      symbol: String(ctx.symbol),
      tf: String(ctx.tf),
      horizon: ctx.horizon,
      provider: String(ctx.provider),
      p50: storeEntry.p50,
      p10: storeEntry.p10,
      p90: storeEntry.p90,
      meta: {
        runtime_ms: inferResult.diag.runtime_ms,
        backend: 'client',
        model_ver: inferResult.diag.model_ver,
      },
    };
  }

  private static generateHistoryId(): string {
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.randomUUID === 'function'
    ) {
      return globalThis.crypto.randomUUID();
    }
    return `fc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
