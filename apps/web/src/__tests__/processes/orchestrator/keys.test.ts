import { describe, it, expect } from 'vitest';
import {
  makeTimeseriesKey,
  makeForecastKey,
} from '@/processes/orchestrator/keys';
type TimeseriesKeyParams = Parameters<typeof makeTimeseriesKey>[0];
type ForecastKeyParams = Parameters<typeof makeForecastKey>[0];

describe('keys', () => {
  describe('makeTimeseriesKey', () => {
    it('builds timeseries key from all parts', () => {
      const key = makeTimeseriesKey({
        provider: 'BINANCE',
        symbol: 'BTCUSDT',
        tf: '1h',
        window: 6,
      });

      expect(key).toBe('BINANCE:BTCUSDT:1h:6M');
    });

    it('changes key when provider changes', () => {
      const k1 = makeTimeseriesKey({
        provider: 'BINANCE',
        symbol: 'BTCUSDT',
        tf: '1h',
        window: 6,
      });
      const k2 = makeTimeseriesKey({
        provider: 'MOCK',
        symbol: 'BTCUSDT',
        tf: '1h',
        window: 6,
      });

      expect(k1).not.toBe(k2);
    });

    it('changes key when symbol changes', () => {
      const k1 = makeTimeseriesKey({
        provider: 'BINANCE',
        symbol: 'BTCUSDT',
        tf: '1h',
        window: 6,
      });
      const k2 = makeTimeseriesKey({
        provider: 'BINANCE',
        symbol: 'ETHUSDT',
        tf: '1h',
        window: 6,
      });

      expect(k1).not.toBe(k2);
    });

    it('changes key when timeframe or window changes', () => {
      const base: TimeseriesKeyParams = {
        provider: 'BINANCE',
        symbol: 'BTCUSDT',
        tf: '1h' as const,
        window: 6,
      };

      const k1 = makeTimeseriesKey(base);
      const k2 = makeTimeseriesKey({ ...base, tf: '8h' });
      const k3 = makeTimeseriesKey({ ...base, window: 12 });

      expect(k1).not.toBe(k2);
      expect(k1).not.toBe(k3);
      expect(k2).not.toBe(k3);
    });
  });

  describe('makeForecastKey', () => {
    it('builds forecast key with explicit model', () => {
      const key = makeForecastKey({
        symbol: 'SBER',
        tf: '1d',
        horizon: 24,
        model: 'xgb_v1',
      });

      expect(key).toBe('SBER:1d:h24:mxgb_v1');
    });

    it('uses client as default model when not provided', () => {
      const key = makeForecastKey({
        symbol: 'SBER',
        tf: '1d',
        horizon: 24,
      });

      expect(key).toBe('SBER:1d:h24:mclient');
    });

    it('different params produce different keys', () => {
      const base = {
        symbol: 'SBER',
        tf: '1d' as const,
        horizon: 24,
        model: 'xgb_v1',
      };

      const k1 = makeForecastKey(base);
      const k2 = makeForecastKey({ ...base, horizon: 48 });
      const k3 = makeForecastKey({ ...base, tf: '1h' });
      const k4 = makeForecastKey({ ...base, model: 'xgb_v2' });

      expect(new Set([k1, k2, k3, k4]).size).toBe(4);
    });
  });
});
