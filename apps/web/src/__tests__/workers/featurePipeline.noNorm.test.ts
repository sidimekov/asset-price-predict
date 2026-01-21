import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('featurePipeline.buildFeatures (no/unsupported normalization)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns raw features when normalization is missing', async () => {
    const { buildFeatures } = await import('@/workers/featurePipeline');

    const modelConfig = {
      featureWindow: 20,
      normalization: null,
    } as any;

    const tail: Array<[number, number]> = [];
    for (let i = 0; i < 25; i++) tail.push([i, 100 + i]);

    const feats = buildFeatures(tail as any, modelConfig);
    expect(feats).toBeInstanceOf(Float32Array);
    expect(feats.length).toBe(10);
  });

  it('returns raw features when normalization type is not zscore', async () => {
    const { buildFeatures } = await import('@/workers/featurePipeline');

    const modelConfig = {
      featureWindow: 20,
      normalization: { type: 'minmax' },
    } as any;

    const tail: Array<[number, number]> = [];
    for (let i = 0; i < 25; i++) tail.push([i, 100 + i]);

    const feats = buildFeatures(tail as any, modelConfig);
    expect(feats).toBeInstanceOf(Float32Array);
    expect(feats.length).toBe(10);
  });
});
