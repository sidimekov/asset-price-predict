import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('featurePipeline.buildFeatures (zscore normalization)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('builds 10 features and applies zscore normalization', async () => {
    vi.doMock('@/config/ml', () => ({
      forecastMinimalConfig: {
        featureWindow: 20,
        normalization: {
          type: 'zscore',
          mean: Array(10).fill(0),
          std: Array(10).fill(1),
          epsilon: 0,
        },
      },
    }));

    const { buildFeatures } = await import('@/workers/featurePipeline');

    // tail length >= featureWindow
    const tail: Array<[number, number]> = [];
    for (let i = 0; i < 25; i++) {
      tail.push([i * 1000, 100 + i]); // close растёт линейно
    }

    const feats = buildFeatures(tail);

    expect(feats).toBeInstanceOf(Float32Array);
    expect(feats.length).toBe(10);

    // при zscore mean=0 std=1 eps=0 -> значения не должны стать NaN/Inf
    for (const v of feats) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('throws EBADINPUT when tail too short', async () => {
    vi.doMock('@/config/ml', () => ({
      forecastMinimalConfig: {
        featureWindow: 20,
        normalization: {
          type: 'zscore',
          mean: Array(10).fill(0),
          std: Array(10).fill(1),
          epsilon: 1e-6,
        },
      },
    }));

    const { buildFeatures } = await import('@/workers/featurePipeline');

    const tail: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) tail.push([i, 100]);

    expect(() => buildFeatures(tail as any)).toThrow(
      /EBADINPUT: tail too short/,
    );
  });

  it('covers returns branch when prev close is 0 (return=0)', async () => {
    vi.doMock('@/config/ml', () => ({
      forecastMinimalConfig: {
        featureWindow: 20,
        normalization: {
          type: 'zscore',
          mean: Array(10).fill(0),
          std: Array(10).fill(1),
          epsilon: 0,
        },
      },
    }));

    const { buildFeatures } = await import('@/workers/featurePipeline');

    const tail: Array<[number, number]> = [];
    for (let i = 0; i < 19; i++) tail.push([i, 100]);
    tail.push([19, 0]); // prev = 0
    tail.push([20, 100]); // curr после нуля

    const feats = buildFeatures(tail as any);
    expect(feats.length).toBe(10);
    for (const v of feats) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});
