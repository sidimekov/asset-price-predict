import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mapProviderToMarket } from '@/processes/orchestrator/provider';

const ORIGINAL_USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_MARKET;

describe('mapProviderToMarket', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_MARKET = ORIGINAL_USE_MOCK;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_MARKET = ORIGINAL_USE_MOCK;
  });

  it('maps providers without mock flag', () => {
    process.env.NEXT_PUBLIC_USE_MOCK_MARKET = '';
    expect(mapProviderToMarket('binance')).toBe('BINANCE');
    expect(mapProviderToMarket('moex')).toBe('MOEX');
    expect(mapProviderToMarket('mock')).toBeNull();
  });

  it('returns MOCK only when flag is enabled', () => {
    process.env.NEXT_PUBLIC_USE_MOCK_MARKET = '1';
    expect(mapProviderToMarket('mock')).toBe('MOCK');
    expect(mapProviderToMarket('custom')).toBe('MOCK');
    expect(mapProviderToMarket('unknown')).toBeNull();
  });
});
