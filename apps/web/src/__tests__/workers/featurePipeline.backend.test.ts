import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('featurePipeline.buildFeaturesWithBackend', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns CPU features when backend is forced to cpu', async () => {
    const { buildFeatures, buildFeaturesWithBackend } = await import(
      '@/workers/featurePipeline'
    );

    const { forecastMinimalConfig } = await import('@/config/ml');
    const tail: Array<[number, number]> = [];
    const size = forecastMinimalConfig.featureWindow + 5;
    for (let i = 0; i < size; i++) tail.push([i, 100 + i]);

    const cpu = buildFeatures(tail as any, forecastMinimalConfig);
    const result = await buildFeaturesWithBackend(
      tail as any,
      forecastMinimalConfig,
      'cpu',
    );

    expect(result.backend).toBe('cpu');
    expect(Array.from(result.features)).toEqual(Array.from(cpu));
  });

  it('falls back to CPU when WebGPU is unavailable', async () => {
    vi.stubGlobal('navigator', {});

    const { buildFeatures, buildFeaturesWithBackend } = await import(
      '@/workers/featurePipeline'
    );

    const { forecastMinimalConfig } = await import('@/config/ml');
    const tail: Array<[number, number]> = [];
    const size = forecastMinimalConfig.featureWindow + 5;
    for (let i = 0; i < size; i++) tail.push([i, 100 + i]);

    const cpu = buildFeatures(tail as any, forecastMinimalConfig);
    const result = await buildFeaturesWithBackend(
      tail as any,
      forecastMinimalConfig,
      'auto',
    );

    expect(result.backend).toBe('cpu');
    expect(Array.from(result.features)).toEqual(Array.from(cpu));
  });
});
