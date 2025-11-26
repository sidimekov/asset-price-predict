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

export const modelRegistry: ModelManifest = [forecastMinimalConfig];

export function getModelConfig(version?: string | null): ForecastModelConfig {
  if (!version) return forecastMinimalConfig;
  const found = modelRegistry.find((m) => m.modelVer === version);
  return found || forecastMinimalConfig;
}

export const DEFAULT_MODEL_VER = forecastMinimalConfig.modelVer;
