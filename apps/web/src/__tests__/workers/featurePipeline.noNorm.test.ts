import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('featurePipeline.buildFeatures (no/unsupported normalization)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns raw features when normalization is missing', async () => {
    vi.doMock('@/config/ml', () => ({
      forecastMinimalConfig: {
        featureWindow: 20,
        normalization: null,
      },
    }));

    const { buildFeatures } = await import('@/workers/featurePipeline');

    const tail: Array<[number, number]> = [];
    for (let i = 0; i < 25; i++) tail.push([i, 100 + i]);

    const feats = buildFeatures(tail as any);
    expect(feats).toBeInstanceOf(Float32Array);
    expect(feats.length).toBe(10);
  });

  it('returns raw features when normalization type is not zscore', async () => {
    vi.doMock('@/config/ml', () => ({
      forecastMinimalConfig: {
        featureWindow: 20,
        normalization: { type: 'minmax' },
      },
    }));

    const { buildFeatures } = await import('@/workers/featurePipeline');

    const tail: Array<[number, number]> = [];
    for (let i = 0; i < 25; i++) tail.push([i, 100 + i]);

    const feats = buildFeatures(tail as any);
    expect(feats).toBeInstanceOf(Float32Array);
    expect(feats.length).toBe(10);
  });
});
