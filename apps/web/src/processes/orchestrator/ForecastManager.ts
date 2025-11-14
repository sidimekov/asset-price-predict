import type { Timeframe, Symbol, Provider, Bar } from '@assetpredict/shared';
import { makeTimeseriesKey, makeForecastKey } from './keys';
import {
  orchestratorState,
  TIMESERIES_TTL_MS,
  getLocalTimeseries,
  setLocalTimeseries,
  isLocalTimeseriesStale,
} from './state';
import type { RootState, AppDispatch } from '@/shared/store';
import { getTimeseries as getTimeseriesFromMarketAdapter } from '@/features/marker-adapter/MarketAdapter';


type OrchestratorInput = {
  symbol: Symbol // символ актива (например SBER, APPL)
  provider: Provider | string // (moex, binance, mock)
  tf: Timeframe // timeframe - шаг по времени между свечами
  window: string | number // какой промежуток времени брать как информацию для прогноза
  horizon: number // на какой промежуток времени прогнозировать
  model?: string | null // выбранная модель (опционально)
}

// на будущее, сейчас не используется
type OrchestratorDeps = {
  dispatch: AppDispatch
  getState: () => RootState
  signal?: AbortSignal
}

/**
 * ForecastManager - центр оркестратора
 * считает ключи и логирует шаги
 */
export class ForecastManager {
  static async run(ctx: OrchestratorInput, deps: OrchestratorDeps): Promise<void> {
    const { symbol, provider, tf, window, horizon, model } = ctx;
    const { dispatch, getState, signal } = deps;

    const tsKey = makeTimeseriesKey({ provider, symbol, tf, window });
    const fcKey = makeForecastKey({ symbol, tf, horizon, model: model || undefined });

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

    const bars = await ForecastManager.ensureTimeseries(
      { tsKey, symbol, provider, tf, window },
      { dispatch, getState, signal },
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Orchestrator] got timeseries', { tsKey, count: bars.length });
    }

    // todo forecast и тд

    orchestratorState.status = 'idle';
  }

  private static async ensureTimeseries(
    args: {
      tsKey: string
      symbol: Symbol
      provider: Provider | string
      tf: Timeframe
      window: string | number
    },
    deps: OrchestratorDeps,
  ): Promise<Bar[]> {
    const { tsKey, symbol, provider, tf, window } = args;
    const { signal } = deps;

    // 1. локальный кэш вместо timeseriesSlice
    const cached = getLocalTimeseries(tsKey);
    const stale = isLocalTimeseriesStale(tsKey, TIMESERIES_TTL_MS);

    if (cached && !stale) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Orchestrator] using local cache', { tsKey });
      }
      return cached.bars;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Orchestrator] loading timeseries with MarketAdapter', { tsKey });
    }

    try {
      const limit = typeof window === 'number' ? window : undefined;

      const result = await getTimeseriesFromMarketAdapter({
        symbol,
        provider,
        timeframe: tf,
        limit,
        signal,
      });

      setLocalTimeseries(tsKey, result.bars);

      return result.bars;

    } catch (err: any) {
      const message = err?.message || 'Failed to load timeseries with MarketAdapter';

      if (process.env.NODE_ENV !== 'production') {
        console.error('[Orchestrator] timeseries error', { tsKey, message });
      }

      // позже dispatch(timeseriesFailed(...)) когда будет timeseriesSlice
      throw err;
    }
  }
}