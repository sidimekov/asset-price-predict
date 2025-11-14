import type { Timeframe, Symbol } from '@assetpredict/shared';
import type { Provider } from '@assetpredict/shared';
import { makeTimeseriesKey, makeForecastKey } from './keys';
import { orchestratorState } from './state';


type OrchestratorInput = {
  symbol: Symbol // символ актива (например SBER, APPL)
  provider: Provider | string // (moex, binance, mock)
  tf: Timeframe // timeframe - шаг по времени между свечами
  window: string | number // какой промежуток времени брать как информацию для прогноза
  horizon: number // на какой промежуток времени прогнозировать
  model?: string | null // выбранная модель (опционально)
}

/**
 * ForecastManager - центр оркестратора
 * считает ключи и логирует шаги
 * todo:
 *  - проверка кэша timeseriesSlice
 *  - вызов marketApi
 *  - работа с ml worker и forecastSlice
 */
export class ForecastManager {
  static run(ctx: OrchestratorInput) {
    const { symbol, provider, tf, window, horizon, model } = ctx;

    const tsKey = makeTimeseriesKey({ provider, symbol, tf, window });
    const fcKey = makeForecastKey({ symbol, tf, horizon, model: model || undefined });

    orchestratorState.status = 'running';

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
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
    orchestratorState.status = 'idle';
  }
}