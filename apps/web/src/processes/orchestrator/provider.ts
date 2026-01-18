'use client';

import type { MarketDataProvider } from '@/config/market';

export function mapProviderToMarket(
  provider: string,
): MarketDataProvider | 'MOCK' | null {
  const normalized = provider.toLowerCase();
  const useMockMarket = process.env.NEXT_PUBLIC_USE_MOCK_MARKET === '1';

  switch (normalized) {
    case 'binance':
      return 'BINANCE';
    case 'moex':
      return 'MOEX';
    case 'mock':
    case 'custom':
      return useMockMarket ? 'MOCK' : null;
    default:
      return null;
  }
}
