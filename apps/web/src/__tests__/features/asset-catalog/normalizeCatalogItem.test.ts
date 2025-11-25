import { describe, it, expect } from 'vitest';
import {
  normalizeCatalogItem,
  normalizeCatalogResponse,
} from '@/features/asset-catalog/lib/normalizeCatalogItem';
import type { CatalogItem } from '@shared/types/market';

describe('normalizeCatalogItem', () => {
  describe('BINANCE provider', () => {
    it('normalizes binance item with baseAsset and quoteAsset', () => {
      const rawItem = {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
      };

      const result = normalizeCatalogItem(rawItem, 'BINANCE');

      expect(result).toEqual({
        symbol: 'BTCUSDT',
        name: 'BTC/USDT',
        exchange: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        provider: 'BINANCE',
      });
    });

    it('normalizes binance item with only symbol', () => {
      const rawItem = {
        symbol: 'ETHUSDT',
      };

      const result = normalizeCatalogItem(rawItem, 'BINANCE');

      expect(result).toEqual({
        symbol: 'ETHUSDT',
        name: 'ETHUSDT',
        exchange: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        provider: 'BINANCE',
      });
    });

    it('creates symbol from baseAsset and quoteAsset when symbol is missing', () => {
      const rawItem = {
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
      };

      const result = normalizeCatalogItem(rawItem, 'BINANCE');

      expect(result).toEqual({
        symbol: 'BTCUSDT',
        name: 'BTC/USDT',
        exchange: 'BINANCE',
        assetClass: 'crypto',
        currency: 'USDT',
        provider: 'BINANCE',
      });
    });

    it('handles binance item with empty symbol and no baseAsset', () => {
      const rawItem = {
        symbol: '',
      };

      const result = normalizeCatalogItem(rawItem, 'BINANCE');
      expect(result?.symbol).toBe('UNDEFINEDUNDEFINED');
    });

    it('converts symbol to uppercase', () => {
      const rawItem = {
        symbol: 'btcusdt',
        baseAsset: 'btc',
        quoteAsset: 'usdt',
      };

      const result = normalizeCatalogItem(rawItem, 'BINANCE');

      expect(result?.symbol).toBe('BTCUSDT');
      expect(result?.name).toBe('btc/usdt');
    });
  });

  describe('MOEX provider', () => {
    it('normalizes moex item with all fields', () => {
      const rawItem = {
        SECID: 'SBER',
        SHORTNAME: 'Сбербанк',
        BOARDID: 'TQBR',
        TYPE: 'stock',
        CURRENCYID: 'RUB',
      };

      const result = normalizeCatalogItem(rawItem, 'MOEX');

      expect(result).toEqual({
        symbol: 'SBER',
        name: 'Сбербанк',
        exchange: 'MOEX',
        assetClass: 'equity',
        currency: 'RUB',
        provider: 'MOEX',
      });
    });

    it('normalizes moex item with alternative field names', () => {
      const rawItem = {
        SECID: 'GAZP',
        NAME: 'Газпром',
        MARKET: 'MOEX',
        SECTYPE: 'shares',
        CURRENCY: 'RUB',
      };

      const result = normalizeCatalogItem(rawItem, 'MOEX');

      expect(result).toEqual({
        symbol: 'GAZP',
        name: 'Газпром',
        exchange: 'MOEX',
        assetClass: 'equity',
        currency: 'RUB',
        provider: 'MOEX',
      });
    });

    it('uses default values for missing moex fields', () => {
      const rawItem = {
        SECID: 'TEST',
      };

      const result = normalizeCatalogItem(rawItem, 'MOEX');

      expect(result).toEqual({
        symbol: 'TEST',
        name: 'TEST',
        exchange: 'MOEX',
        assetClass: 'equity',
        currency: 'RUB',
        provider: 'MOEX',
      });
    });

    it('uses symbol field as fallback for SECID', () => {
      const rawItem = {
        symbol: 'TEST',
      };

      const result = normalizeCatalogItem(rawItem, 'MOEX');

      expect(result?.symbol).toBe('TEST');
      expect(result?.name).toBe('TEST');
    });

    it('trims whitespace from symbol', () => {
      const rawItem = {
        SECID: '  SBER  ',
        SHORTNAME: 'Сбербанк',
      };

      const result = normalizeCatalogItem(rawItem, 'MOEX');

      expect(result?.symbol).toBe('SBER');
    });

    it('handles moex item with empty SECID', () => {
      const rawItem = {
        SECID: '',
        SHORTNAME: 'Test',
      };

      const result = normalizeCatalogItem(rawItem, 'MOEX');
      expect(result).toBeNull();
    });
  });

  describe('MOCK provider', () => {
    it('normalizes mock item with symbol and name', () => {
      const rawItem = {
        symbol: 'TEST',
        name: 'Test Asset',
      };

      const result = normalizeCatalogItem(rawItem, 'MOCK');

      expect(result).toEqual({
        symbol: 'TEST',
        name: 'Test Asset',
        provider: 'MOCK',
      });
    });

    it('converts symbol to uppercase for mock items', () => {
      const rawItem = {
        symbol: 'test',
        name: 'Test Asset',
      };

      const result = normalizeCatalogItem(rawItem, 'MOCK');

      expect(result?.symbol).toBe('TEST');
    });

    it('returns null for mock item without symbol', () => {
      const rawItem = {
        name: 'Test Asset',
      };

      const result = normalizeCatalogItem(rawItem, 'MOCK');
      expect(result).toBeNull();
    });

    it('returns null for mock item without name', () => {
      const rawItem = {
        symbol: 'TEST',
      };

      const result = normalizeCatalogItem(rawItem, 'MOCK');
      expect(result).toBeNull();
    });
  });

  describe('CUSTOM provider', () => {
    it('normalizes custom item with symbol and name', () => {
      const rawItem = {
        symbol: 'CUSTOM1',
        name: 'Custom Asset',
      };

      const result = normalizeCatalogItem(rawItem, 'CUSTOM');

      expect(result).toEqual({
        symbol: 'CUSTOM1',
        name: 'Custom Asset',
        provider: 'CUSTOM',
      });
    });

    it('returns null for custom item without required fields', () => {
      const rawItem = {
        symbol: 'CUSTOM1',
      };

      const result = normalizeCatalogItem(rawItem, 'CUSTOM');
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns null for null or undefined raw data', () => {
      expect(normalizeCatalogItem(null, 'BINANCE')).toBeNull();
      expect(normalizeCatalogItem(undefined, 'MOEX')).toBeNull();
    });

    it('handles empty object for BINANCE provider', () => {
      const result = normalizeCatalogItem({}, 'BINANCE');
      expect(result?.symbol).toBe('UNDEFINEDUNDEFINED');
    });

    it('returns null for unsupported provider', () => {
      const rawItem = { symbol: 'TEST', name: 'Test' };
      // @ts-ignore - testing invalid provider
      const result = normalizeCatalogItem(rawItem, 'UNKNOWN');
      expect(result).toBeNull();
    });
  });
});

describe('normalizeCatalogResponse', () => {
  it('returns empty array for empty input', () => {
    expect(normalizeCatalogResponse([], 'BINANCE')).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    // @ts-ignore - testing invalid input
    expect(normalizeCatalogResponse(null, 'BINANCE')).toEqual([]);
    // @ts-ignore - testing invalid input
    expect(normalizeCatalogResponse({}, 'MOEX')).toEqual([]);
    // @ts-ignore - testing invalid input
    expect(normalizeCatalogResponse('string', 'MOCK')).toEqual([]);
  });

  it('filters out null results and returns only valid CatalogItems', () => {
    const rawData = [
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }, // valid
      { symbol: '', baseAsset: 'ETH', quoteAsset: 'USDT' }, // valid (creates symbol)
      { SECID: 'SBER', SHORTNAME: 'Сбербанк' }, // valid for BINANCE too
      { symbol: 'ETHUSDT' }, // valid
      {}, // valid (creates UNDEFINEDUNDEFINED)
    ];

    const result = normalizeCatalogResponse(rawData, 'BINANCE');

    expect(result.length).toBe(5);
    expect(result[0].symbol).toBe('BTCUSDT');
    expect(result[1].symbol).toBe('ETHUSDT');
  });

  it('works with MOEX provider data', () => {
    const rawData = [
      { SECID: 'SBER', SHORTNAME: 'Сбербанк' },
      { SECID: 'GAZP', NAME: 'Газпром' },
      { SECID: '' }, // invalid - will be filtered
      { symbol: 'TEST' }, // valid - uses symbol as fallback
    ];

    const result = normalizeCatalogResponse(rawData, 'MOEX');

    expect(result).toHaveLength(3);
    expect(result[0].symbol).toBe('SBER');
    expect(result[1].symbol).toBe('GAZP');
    expect(result[2].symbol).toBe('TEST');
  });

  it('works with MOCK provider data', () => {
    const rawData = [
      { symbol: 'MOCK1', name: 'Mock Asset 1' },
      { symbol: 'MOCK2' }, // invalid - missing name
      { name: 'Mock Asset 3' }, // invalid - missing symbol
      { symbol: 'MOCK4', name: 'Mock Asset 4' }, // valid
    ];

    const result = normalizeCatalogResponse(rawData, 'MOCK');

    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('MOCK1');
    expect(result[1].symbol).toBe('MOCK4');
  });

  it('works with CUSTOM provider data', () => {
    const rawData = [
      { symbol: 'CUSTOM1', name: 'Custom Asset 1' },
      { symbol: 'CUSTOM2' }, // invalid
    ];

    const result = normalizeCatalogResponse(rawData, 'CUSTOM');

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('CUSTOM1');
    expect(result[0].name).toBe('Custom Asset 1');
  });
});
