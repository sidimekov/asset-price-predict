import type { Symbol, Bar } from '@assetpredict/shared';
import { makeTimeseriesKey, makeForecastKey } from './keys';
import {
  orchestratorState,
  TIMESERIES_TTL_MS,
  getLocalTimeseries,
  setLocalTimeseries,
  isLocalTimeseriesStale,
  getLocalForecast,
  setLocalForecast,
  type LocalForecastEntry,
} from './state';
import type { RootState, AppDispatch } from '@/shared/store';
import { getMarketTimeseries } from '@/features/market-adapter/MarketAdapter';
import type { MarketDataProvider, MarketTimeframe } from '@/config/market';

import { inferForecast } from './mlWorkerClient';

export type OrchestratorInput = {
  symbol: Symbol; // символ актива (например SBER, APPL)
  provider: MarketDataProvider | 'MOCK'; // (MOEX, BINANCE, CUSTOM, MOCK)
  tf: MarketTimeframe; // таймфрейм (шаг между барами)
  window: number; // сколько баров брать в качестве «истории» для прогноза
  horizon: number; // на сколько баров вперёд прогнозировать
  model?: string | null; // выбранная модель (опционально)
};

type OrchestratorDeps = {
  dispatch: AppDispatch;
  getState: () => RootState;
  signal?: AbortSignal;
};

/**
 * ForecastManager - центр оркестратора
 * Считает ключи, решает, откуда брать таймсерии, вызывает воркер и кладёт прогноз в кэш
 */
export class ForecastManager {
  static async run(
    ctx: OrchestratorInput,
    deps: OrchestratorDeps,
  ): Promise<void> {
    const { symbol, provider, tf, window, horizon, model } = ctx;
    const { dispatch, getState, signal } = deps;

    const tsKey = makeTimeseriesKey({ provider, symbol, tf, window });
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

    // 1. Загружаем / берём из кэша таймсерии
    const bars = await ForecastManager.ensureTimeseries(
      { tsKey, symbol, provider, tf, window },
      { dispatch, getState, signal },
    );

    // 2. Если прогноз уже есть в локальном кэше - используем его и завершаем
    const existingForecast = getLocalForecast(fcKey);
    if (existingForecast) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Orchestrator] using cached forecast', { fcKey });
      }
      orchestratorState.status = 'idle';
      return;
    }

    // 3. Формируем хвост для воркера
    const tail = ForecastManager.buildTailForWorker(bars, horizon);

    // 4. Вызов ML-воркера
    const inferResult = await inferForecast(tail, horizon, model ?? undefined);

    const entry: LocalForecastEntry = {
      series: {
        p10: inferResult.p10,
        p50: inferResult.p50,
        p90: inferResult.p90,
      },
      meta: inferResult.diag,
    };

    // 5. Кладём в локальный кэш прогнозов
    setLocalForecast(fcKey, entry);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Orchestrator] forecast ready', {
        fcKey,
        horizon,
        points: inferResult.p50.length,
      });
    }

    orchestratorState.status = 'idle';
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
    const { dispatch } = deps;

    // 1. Временный локальный кэш вместо timeseriesSlice
    const cached = getLocalTimeseries(tsKey);
    const stale = isLocalTimeseriesStale(tsKey, TIMESERIES_TTL_MS);

    if (cached && !stale) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Orchestrator] using local cache', { tsKey });
      }
      return cached.bars;
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

    try {
      const limit =
        typeof window === 'number' && window > 0 ? window : undefined;

      const adapterRes = await getMarketTimeseries(dispatch, {
        symbol,
        provider,
        timeframe: tf,
        limit,
      });

      if ('code' in adapterRes) {
        throw new Error(adapterRes.message);
      }

      const bars = adapterRes.bars;
      setLocalTimeseries(tsKey, bars);

      return bars;
    } catch (err: any) {
      const message =
        err?.message || 'Failed to load timeseries with MarketAdapter';

      if (process.env.NODE_ENV !== 'production') {
        console.error('[Orchestrator] timeseries error', { tsKey, message });
      }

      // позже здесь появится dispatch(timeseriesFailed(...)), когда будет timeseriesSlice
      throw err;
    }
  }

  /**
   * Построить "хвост" временного ряда как данные для прогноза
   * Берём max(horizon*2, 128) последних свеч и упрощаем до [ts, close]
   */
  private static buildTailForWorker(
    bars: Bar[],
    horizon: number,
  ): Array<[number, number]> {
    if (!bars.length) return [];
    const tailSize = Math.max(horizon * 2, 128);
    const slice = bars.slice(-tailSize);

    // формат Bar = [ts, o, h, l, c, v?]
    return slice.map((b) => {
      const ts = b[0];
      const close = b[4];
      return [ts, close] as [number, number];
    });
  }
}
