import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MODEL_VER,
  forecastMinimalConfig,
  getModelConfig,
} from '@/config/ml';

describe('ml config', () => {
  it('returns default config when version is empty', () => {
    expect(getModelConfig()).toBe(forecastMinimalConfig);
    expect(getModelConfig(null)).toBe(forecastMinimalConfig);
  });

  it('returns config for known version or falls back to default', () => {
    const known = getModelConfig(forecastMinimalConfig.modelVer);
    expect(known).toBe(forecastMinimalConfig);

    const fallback = getModelConfig('unknown-version');
    expect(fallback).toBe(forecastMinimalConfig);
  });

  it('exports default model version', () => {
    expect(DEFAULT_MODEL_VER).toBe(forecastMinimalConfig.modelVer);
  });
});
