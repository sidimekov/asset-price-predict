import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MODEL_VER,
  forecastLgbmConfig,
  forecastMinimalConfig,
  getModelConfig,
} from '@/config/ml';

describe('ml config', () => {
  it('returns default config when version is empty', () => {
    expect(getModelConfig()).toBe(forecastLgbmConfig);
    expect(getModelConfig(null)).toBe(forecastLgbmConfig);
  });

  it('returns config for known version or falls back to default', () => {
    const lgbm = getModelConfig(forecastLgbmConfig.modelVer);
    expect(lgbm).toBe(forecastLgbmConfig);

    const known = getModelConfig(forecastMinimalConfig.modelVer);
    expect(known).toBe(forecastMinimalConfig);

    const fallback = getModelConfig('unknown-version');
    expect(fallback).toBe(forecastLgbmConfig);
  });

  it('exports default model version', () => {
    expect(DEFAULT_MODEL_VER).toBe(forecastLgbmConfig.modelVer);
  });
});
