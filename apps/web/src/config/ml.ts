import catboostManifest from './ml.catboost_v1.json';
import lgbmManifest from './ml.lgbm_v1.json';
import manifest from './ml.manifest.json';

export type Normalization = {
  type: 'zscore';
  mean: number[];
  std: number[];
  epsilon: number;
};

export type ForecastModelConfig = {
  modelName: string;
  modelVer: string;
  path: string;
  quantPath?: string;
  onnxSha256: string;
  quantSha256?: string;
  inputShape: [number, number];
  horizonSteps: number;
  featureWindow: number;
  tailSize: number;
  normalization: Normalization;
  features: { name: string; description?: string }[];
  outputs: Array<'delta' | 'p50' | 'p10' | 'p90'>;
  postprocess: 'last_close_plus_delta' | 'none';
  rtol: number;
  atol: number;
  val_metrics?: Record<string, number>;
};

export type ModelManifest = ForecastModelConfig[];

export const forecastMinimalConfig: ForecastModelConfig = {
  ...manifest,
  inputShape: manifest.inputShape as [number, number],
  normalization: manifest.normalization as Normalization,
  outputs: manifest.outputs as ForecastModelConfig['outputs'],
  postprocess: manifest.postprocess as ForecastModelConfig['postprocess'],
};

export const forecastLgbmConfig: ForecastModelConfig = {
  ...lgbmManifest,
  inputShape: lgbmManifest.inputShape as [number, number],
  normalization: lgbmManifest.normalization as Normalization,
  outputs: lgbmManifest.outputs as ForecastModelConfig['outputs'],
  postprocess: lgbmManifest.postprocess as ForecastModelConfig['postprocess'],
};

export const forecastCatboostConfig: ForecastModelConfig = {
  ...catboostManifest,
  inputShape: catboostManifest.inputShape as [number, number],
  normalization: catboostManifest.normalization as Normalization,
  outputs: catboostManifest.outputs as ForecastModelConfig['outputs'],
  postprocess:
    catboostManifest.postprocess as ForecastModelConfig['postprocess'],
};

export const modelRegistry: ModelManifest = [
  forecastLgbmConfig,
  forecastCatboostConfig,
  forecastMinimalConfig,
];

export type ModelAlias = 'minimal' | 'lgbm' | 'catboost';

export const modelAliasToVersion: Record<ModelAlias, string> = {
  minimal: forecastMinimalConfig.modelVer,
  lgbm: forecastLgbmConfig.modelVer,
  catboost: forecastCatboostConfig.modelVer,
};

export function resolveModelVersion(model?: string | null): string | null {
  if (!model) return null;
  const normalized = model.toLowerCase();
  if (normalized in modelAliasToVersion) {
    return modelAliasToVersion[normalized as ModelAlias];
  }
  const found = modelRegistry.find(
    (entry) => entry.modelVer === model || entry.modelName === model,
  );
  return found?.modelVer ?? null;
}

export function getModelConfig(version?: string | null): ForecastModelConfig {
  if (!version) return forecastLgbmConfig;
  const found = modelRegistry.find((m) => m.modelVer === version);
  return found || forecastLgbmConfig;
}

export const DEFAULT_MODEL_VER = forecastLgbmConfig.modelVer;
export const FALLBACK_MODEL_VER = forecastMinimalConfig.modelVer;
