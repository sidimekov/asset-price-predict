import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Bar } from '@assetpredict/shared';
import {
  orchestratorState,
  TIMESERIES_TTL_MS,
  getLocalTimeseries,
  setLocalTimeseries,
  isLocalTimeseriesStale,
  getLocalForecast,
  setLocalForecast,
  selectSelectedAsset,
  selectForecastParams,
} from '@/processes/orchestrator/state';

describe('orchestrator state', () => {
  const realDateNow = Date.now;

  beforeEach(() => {
    // Сбрасываем статус перед каждым тестом
    orchestratorState.status = 'idle';
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    // возвращаем Date.now
    // @ts-expect-no-error
    Date.now = realDateNow;
  });

  it('has idle status by default', () => {
    expect(orchestratorState.status).toBe('idle');
  });

  describe('local timeseries cache', () => {
    it('stores and returns timeseries by key', () => {
      const bars: Bar[] = [
        [0, 1, 2, 0.5, 1.5, 100],
        [1, 1.5, 2.5, 1, 2, 120],
      ];

      setLocalTimeseries('k1', bars);
      const entry = getLocalTimeseries('k1');

      expect(entry).toBeDefined();
      expect(entry?.bars).toEqual(bars);
      expect(typeof entry?.fetchedAt).toBe('number');
    });

    it('treats missing key as stale', () => {
      const isStale = isLocalTimeseriesStale('unknown');
      expect(isStale).toBe(true);
    });

    it('is not stale immediately after set', () => {
      const bars: Bar[] = [[0, 1, 1, 1, 1, 10]];
      setLocalTimeseries('fresh', bars);

      const stale = isLocalTimeseriesStale('fresh', TIMESERIES_TTL_MS);
      expect(stale).toBe(false);
    });

    it('becomes stale after TTL passes', () => {
      const bars: Bar[] = [[0, 1, 1, 1, 1, 10]];
      setLocalTimeseries('old', bars);

      // время за пределы TTL
      vi.setSystemTime(TIMESERIES_TTL_MS + 1);

      const stale = isLocalTimeseriesStale('old', TIMESERIES_TTL_MS);
      expect(stale).toBe(true);
    });
  });

  describe('local forecast cache', () => {
    it('stores and returns forecast by key', () => {
      const entry = {
        series: {
          p10: [90, 91],
          p50: [100, 101],
          p90: [110, 111],
        },
        meta: {
          runtime_ms: 10,
          backend: 'mock-backend',
          model_ver: 'mock-v0',
        },
      };

      setLocalForecast('fc1', entry);
      const got = getLocalForecast('fc1');

      expect(got).toEqual(entry);
    });

    it('returns undefined for unknown forecast key', () => {
      const got = getLocalForecast('unknown');
      expect(got).toBeUndefined();
    });
  });

  describe('selectors', () => {
    it('selectSelectedAsset returns selected asset when present', () => {
      const state: any = {
        catalog: {
          selected: { symbol: 'SBER', provider: 'MOCK' },
        },
      };

      const selected = selectSelectedAsset(state);
      expect(selected).toEqual({ symbol: 'SBER', provider: 'MOCK' });
    });

    it('selectSelectedAsset returns undefined when missing', () => {
      const state: any = {
        catalog: {},
      };

      const selected = selectSelectedAsset(state);
      expect(selected).toBeUndefined();
    });

    it('selectForecastParams returns params when present', () => {
      const state: any = {
        forecast: {
          params: {
            tf: '1h',
            window: 200,
            horizon: 24,
            model: null,
          },
        },
      };

      const params = selectForecastParams(state);
      expect(params).toEqual({
        tf: '1h',
        window: 200,
        horizon: 24,
        model: null,
      });
    });

    it('selectForecastParams returns undefined when missing', () => {
      const state: any = {
        forecast: {},
      };

      const params = selectForecastParams(state);
      expect(params).toBeUndefined();
    });
  });
});
