'use client';

import type { MarketDataProvider } from '@/config/market';

export function mapProviderToMarket(
  provider: string,
): MarketDataProvider | 'MOCK' | null {
  if (process.env.NODE_ENV !== 'production') return 'MOCK';
  switch (provider) {
    case 'binance':
      return 'BINANCE';
    case 'moex':
      return 'MOEX';
    default:
      return null;
  }
}
