import { describe, it, expect } from 'vitest';
import { zForecastCreateReq, zForecastDetailRes } from '../src/schemas/forecast.schema.js';
import { MAX_HORIZON } from '../src/types/common.js';

describe('zForecastCreateReq', () => {
  it('должен принимать валидный объект', () => {
    const valid = {
      symbol: 'AAPL',
      timeframe: '1d',
      horizon: 100,
    };

    const result = zForecastCreateReq.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(valid);
    }
  });

  it('должен принимать валидный объект с опциональными полями', () => {
    const valid = {
      symbol: 'BTCUSDT',
      timeframe: '1h',
      horizon: 50,
      inputUntil: '2025-01-31T12:00:00Z',
      model: 'lstm-v1',
    };

    const result = zForecastCreateReq.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('должен отклонять невалидный timeframe', () => {
    const invalid = {
      symbol: 'AAPL',
      timeframe: '2h', // не поддерживается
      horizon: 100,
    };

    const result = zForecastCreateReq.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('timeframe'))).toBe(true);
    }
  });

  it('должен отклонять horizon > MAX_HORIZON', () => {
    const invalid = {
      symbol: 'AAPL',
      timeframe: '1d',
      horizon: MAX_HORIZON + 1,
    };

    const result = zForecastCreateReq.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const horizonError = result.error.errors.find((e) => e.path.includes('horizon'));
      expect(horizonError).toBeDefined();
      expect(horizonError?.message).toContain(MAX_HORIZON.toString());
    }
  });

  it('должен отклонять отрицательный horizon', () => {
    const invalid = {
      symbol: 'AAPL',
      timeframe: '1d',
      horizon: -1,
    };

    const result = zForecastCreateReq.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('должен отклонять пустой symbol', () => {
    const invalid = {
      symbol: '',
      timeframe: '1d',
      horizon: 100,
    };

    const result = zForecastCreateReq.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('zForecastDetailRes', () => {
  it('должен принимать валидный объект без опциональных полей', () => {
    const valid = {
      id: 'forecast-123',
      symbol: 'AAPL',
      timeframe: '1d',
      createdAt: '2025-01-31T12:00:00Z',
      horizon: 100,
      series: {
        p10: [100, 101, 102],
        p50: [105, 106, 107],
        p90: [110, 111, 112],
        t: [1000, 2000, 3000],
      },
    };

    const result = zForecastDetailRes.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('должен принимать валидный объект с factors и metrics', () => {
    const valid = {
      id: 'forecast-123',
      symbol: 'AAPL',
      timeframe: '1d',
      createdAt: '2025-01-31T12:00:00Z',
      horizon: 100,
      series: {
        p10: [100],
        p50: [105],
        p90: [110],
        t: [1000],
      },
      factors: [
        { name: 'volume', impact: 0.5, shap: 0.3, conf: 0.8 },
      ],
      metrics: {
        mae: 2.5,
        mape: 1.2,
        coverage: 0.95,
      },
    };

    const result = zForecastDetailRes.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('должен проверять, что series.t.length === series.p50.length', () => {
    const invalid = {
      id: 'forecast-123',
      symbol: 'AAPL',
      timeframe: '1d',
      createdAt: '2025-01-31T12:00:00Z',
      horizon: 100,
      series: {
        p10: [100, 101],
        p50: [105, 106, 107], // разная длина
        p90: [110, 111],
        t: [1000, 2000],
      },
    };

    const result = zForecastDetailRes.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) => e.message.includes('same length'));
      expect(error).toBeDefined();
    }
  });

  it('должен проверять логику перцентилей: p10 <= p50 <= p90', () => {
    const invalid = {
      id: 'forecast-123',
      symbol: 'AAPL',
      timeframe: '1d',
      createdAt: '2025-01-31T12:00:00Z',
      horizon: 100,
      series: {
        p10: [110], // больше p50 - неверно
        p50: [105],
        p90: [100], // меньше p50 - неверно
        t: [1000],
      },
    };

    const result = zForecastDetailRes.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) => e.message.includes('p10 <= p50 <= p90'));
      expect(error).toBeDefined();
    }
  });
});

