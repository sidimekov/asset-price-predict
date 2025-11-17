import { describe, it, expect } from 'vitest';
import {
  normalizeCatalogItem,
  normalizeCatalogResponse,
} from '@/features/asset-catalog/lib/normalizeCatalogItem';
import type { CatalogItem } from '@/features/asset-catalog/model/catalogSlice';

describe('normalizeCatalogItem', () => {
  describe('binance provider', () => {
    it('normalizes binance item with baseAsset and quoteAsset', () => {
      const rawItem = {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
      };

      const result = normalizeCatalogItem(rawItem, 'binance');

      expect(result).toEqual({
        symbol: 'BTCUSDT',
        name: 'BTC/USDT',
        assetClass: 'crypto',
        currency: 'USDT',
        provider: 'binance',
      });
    });

    it('normalizes binance item without baseAsset/quoteAsset', () => {
      const rawItem = {
        symbol: 'ETHUSDT',
      };

      const result = normalizeCatalogItem(rawItem, 'binance');

      expect(result).toEqual({
        symbol: 'ETHUSDT',
        name: 'ETHUSDT',
        assetClass: 'crypto',
        currency: 'USDT',
        provider: 'binance',
      });
    });

    it('handles binance item with empty symbol', () => {
      const rawItem = {
        symbol: '',
      };

      const result = normalizeCatalogItem(rawItem, 'binance');

      expect(result).toBeNull();
    });
  });

  describe('moex provider', () => {
    it('normalizes moex item with all fields', () => {
      const rawItem = {
        SECID: 'SBER',
        SHORTNAME: 'Сбербанк',
        BOARDID: 'TQBR',
        TYPE: 'stock',
        CURRENCYID: 'RUB',
      };

      const result = normalizeCatalogItem(rawItem, 'moex');

      expect(result).toEqual({
        symbol: 'SBER',
        name: 'Сбербанк',
        exchange: 'TQBR',
        assetClass: 'equity',
        currency: 'RUB',
        provider: 'moex',
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

      const result = normalizeCatalogItem(rawItem, 'moex');

      expect(result).toEqual({
        symbol: 'GAZP',
        name: 'Газпром',
        exchange: 'MOEX',
        assetClass: 'equity',
        currency: 'RUB',
        provider: 'moex',
      });
    });

    it('uses default values for missing moex fields', () => {
      const rawItem = {
        SECID: 'TEST',
      };

      const result = normalizeCatalogItem(rawItem, 'moex');

      expect(result).toEqual({
        symbol: 'TEST',
        name: 'TEST',
        exchange: 'moex',
        assetClass: 'equity',
        currency: 'RUB',
        provider: 'moex',
      });
    });

    it('maps moex asset types correctly', () => {
      const testCases = [
        { type: 'stock', expected: 'equity' },
        { type: 'shares', expected: 'equity' },
        { type: 'currency', expected: 'fx' },
        { type: 'fund', expected: 'etf' },
        { type: 'etf', expected: 'etf' },
        { type: 'bond', expected: 'bond' },
        { type: 'future', expected: 'futures' },
        { type: 'unknown', expected: 'unknown' },
        { type: '', expected: 'equity' },
      ];

      testCases.forEach(({ type, expected }) => {
        const rawItem = {
          SECID: 'TEST',
          TYPE: type,
        };

        const result = normalizeCatalogItem(rawItem, 'moex');
        expect(result?.assetClass).toBe(expected);
      });
    });
  });

  describe('edge cases', () => {
    it('returns null for invalid raw data', () => {
      expect(normalizeCatalogItem(null, 'binance')).toBeNull();
      expect(normalizeCatalogItem(undefined, 'moex')).toBeNull();
      expect(normalizeCatalogItem({}, 'binance')).toBeNull();
    });

    it('returns null for unsupported provider', () => {
      const rawItem = { symbol: 'TEST' };
      // @ts-ignore - testing invalid provider
      const result = normalizeCatalogItem(rawItem, 'unknown');
      expect(result).toBeNull();
    });

    it('trims symbol whitespace', () => {
      const rawItem = {
        symbol: '  BTCUSDT  ',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
      };

      const result = normalizeCatalogItem(rawItem, 'binance');
      expect(result?.symbol).toBe('BTCUSDT');
    });
  });
});

describe('normalizeCatalogResponse', () => {
  it('returns empty array for empty input', () => {
    expect(normalizeCatalogResponse([], 'binance')).toEqual([]);
  });
});
