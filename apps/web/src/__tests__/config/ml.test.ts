import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MODEL_VER,
  forecastCatboostConfig,
  forecastLgbmConfig,
  forecastMinimalConfig,
  getModelConfig,
  resolveModelVersion,
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

  it('resolves model aliases and versions', () => {
    expect(resolveModelVersion('minimal')).toBe(forecastMinimalConfig.modelVer);
    expect(resolveModelVersion('lgbm')).toBe(forecastLgbmConfig.modelVer);
    expect(resolveModelVersion('catboost')).toBe(
      forecastCatboostConfig.modelVer,
    );
    expect(resolveModelVersion(forecastCatboostConfig.modelVer)).toBe(
      forecastCatboostConfig.modelVer,
    );
    expect(resolveModelVersion('unknown')).toBeNull();
  });

  it('exports default model version', () => {
    expect(DEFAULT_MODEL_VER).toBe(forecastLgbmConfig.modelVer);
  });
});
