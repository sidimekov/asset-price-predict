// apps/web/src/features/market-adapter/providers/MockProvider.ts
import type { AppDispatch } from '@/shared/store';
import { marketApi } from '@/shared/api/marketApi';
import type { ProviderRequestBase } from './BinanceProvider';
import type { CatalogItem } from '@shared/types/market';

/**
 * Вариант 1 – берём моковые данные с API через RTK Query.
 */
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

/**
 * Вариант 2 – полностью локальный генератор свечей без сети.
 * Используется тем же контрактом ProviderRequestBase.
 */
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

/**
 * Сырой тип мокового символа (немного отличается от CatalogItem, чтобы была "нормализация").
 */
export type MockSymbolRaw = {
  symbol: string;
  name: string;
  exchange: string;
  class: CatalogItem['assetClass'];
  currency?: string;
};

/**
 * Статический моковый каталог инструментов.
 * Можно потом вынести в отдельный JSON.
 */
const MOCK_SYMBOLS: MockSymbolRaw[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin / Tether',
    exchange: 'BINANCE',
    class: 'crypto',
    currency: 'USDT',
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum / Tether',
    exchange: 'BINANCE',
    class: 'crypto',
    currency: 'USDT',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    class: 'equity',
    currency: 'USD',
  },
  {
    symbol: 'SBER',
    name: 'Sberbank',
    exchange: 'MOEX',
    class: 'equity',
    currency: 'RUB',
  },
];

/**
 * Поиск в моковом каталоге по строке запроса.
 * Никакого HTTP, всё локально.
 */
export async function searchMockSymbols(
  query: string,
): Promise<MockSymbolRaw[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return MOCK_SYMBOLS.filter((item) => {
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.exchange.toLowerCase().includes(q)
    );
  });
}
