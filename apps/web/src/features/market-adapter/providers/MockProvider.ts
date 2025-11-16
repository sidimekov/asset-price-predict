import type { AppDispatch } from '@/shared/store'; //
import { marketApi } from '@/shared/api/marketApi';
import type { ProviderRequestBase } from './BinanceProvider';

// Можно дергать моковый эндпоинт ИЛИ генерить данные локально.
// Здесь – вариант через RTK Query эндпоинт.

export async function fetchMockTimeseries(
  dispatch: AppDispatch,
  params: ProviderRequestBase,
): Promise<unknown> {
  const { symbol, timeframe, limit } = params;

  const queryResult = dispatch(
    marketApi.endpoints.getMockTimeseries.initiate({
      symbol,
      timeframe,
      limit,
    }),
  );

  try {
    const data = await queryResult.unwrap();
    return data;
  } finally {
    queryResult.unsubscribe();
  }
}

// Если хочется синтетические бары вообще без сети — можно сделать генератор (опционально):
export function generateMockBarsRaw(
  params: ProviderRequestBase,
): [number, number, number, number, number, number][] {
  const { limit } = params;
  const now = Date.now();
  const res: [number, number, number, number, number, number][] = [];

  let lastClose = 100;

  for (let i = limit - 1; i >= 0; i--) {
    const ts = now - i * 60 * 60 * 1000; // шаг 1h для примера
    const open = lastClose;
    const high = open + Math.random() * 3;
    const low = open - Math.random() * 3;
    const close = low + Math.random() * (high - low);
    const volume = 10 + Math.random() * 100;

    res.push([ts, open, high, low, close, volume]);
    lastClose = close;
  }

  return res;
}
