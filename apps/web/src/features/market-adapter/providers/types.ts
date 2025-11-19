// apps/web/src/features/market-adapter/providers/types.ts
import type { Symbol as MarketSymbol, Timeframe } from '@shared/types/market';

/**
 * Базовый контракт для запросов к любому маркет-провайдеру.
 * Используется MarketAdapter'ом и всеми провайдерами (Binance/Moex/Mock/Custom).
 */
export interface ProviderRequestBase {
  symbol: MarketSymbol;
  timeframe: Timeframe;
  limit: number;
}
