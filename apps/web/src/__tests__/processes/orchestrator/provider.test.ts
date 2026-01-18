import { describe, it, expect } from 'vitest';
import { mapProviderToMarket } from '@/processes/orchestrator/provider';

describe('mapProviderToMarket', () => {
  it('maps known providers', () => {
    expect(mapProviderToMarket('binance')).toBe('BINANCE');
    expect(mapProviderToMarket('moex')).toBe('MOEX');
    expect(mapProviderToMarket('mock')).toBe('MOCK');
    expect(mapProviderToMarket('custom')).toBe('MOCK');
  });

  it('returns null for unknown provider', () => {
    expect(mapProviderToMarket('unknown')).toBeNull();
  });
});
