import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mapProviderToMarket } from '@/processes/orchestrator/provider';

const ORIGINAL_ENV = process.env.NODE_ENV;

describe('mapProviderToMarket', () => {
  beforeEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  it('returns MOCK in non-production', () => {
    process.env.NODE_ENV = 'development';
    expect(mapProviderToMarket('binance')).toBe('MOCK');
    expect(mapProviderToMarket('moex')).toBe('MOCK');
  });

  it('maps providers in production', () => {
    process.env.NODE_ENV = 'production';
    expect(mapProviderToMarket('binance')).toBe('BINANCE');
    expect(mapProviderToMarket('moex')).toBe('MOEX');
    expect(mapProviderToMarket('unknown')).toBeNull();
  });
});
