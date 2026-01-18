import { forecastMinimalConfig } from '@/config/ml';
import type { TailPoint } from './types';
import { buildFeaturesGpu, isWebGpuSupported } from './featurePipelineGpu';

const MODEL = forecastMinimalConfig;
const FEATURE_BACKEND_PREF = (
  process.env.NEXT_PUBLIC_FEATURES_BACKEND || 'auto'
).toLowerCase();

export type FeatureBackend = 'auto' | 'cpu' | 'webgpu';

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const v =
    values.reduce((acc, x) => acc + (x - m) * (x - m), 0) / values.length;
  return Math.sqrt(v);
}

function ema(values: number[], span: number): number {
  if (!values.length) return 0;
  const alpha = 2 / (span + 1);
  let acc = values[0];
  for (let i = 1; i < values.length; i++) {
    acc = alpha * values[i] + (1 - alpha) * acc;
  }
  return acc;
}

function normalizeZscore(features: number[]): Float32Array {
  const norm = MODEL.normalization;

  // если конфиг поменяется, просто отдаётся как есть
  if (!norm || norm.type !== 'zscore') return Float32Array.from(features);

  return Float32Array.from(
    features.map((value, idx) => {
      const stdv = norm.std[idx] ?? 1;
      const meanv = norm.mean[idx] ?? 0;
      return (value - meanv) / (stdv + norm.epsilon);
    }),
  );
}

/**
 * фиксированные 10 фич только по close
 * требуется минимум featureWindow точек (из конфига модели)
 */
export function buildFeatures(tail: TailPoint[]): Float32Array {
  if (tail.length < MODEL.featureWindow) {
    throw new Error(
      `EBADINPUT: tail too short (need >= ${MODEL.featureWindow}, got ${tail.length})`,
    );
  }

  const closes = tail.slice(-MODEL.featureWindow).map(([, close]) => close);

  // returns
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    returns.push(prev === 0 ? 0 : (curr - prev) / prev);
  }

  const lastClose = closes[closes.length - 1];

  const last5 = closes.slice(-5);
  const last20 = closes.slice(-20);

  const lastReturns5 = returns.slice(-5);
  const lastReturns20 = returns.slice(-20);

  // momentum: разница цены (не %)
  const momentum3 =
    closes.length >= 3 ? lastClose - closes[closes.length - 3] : 0;
  const momentum8 =
    closes.length >= 8 ? lastClose - closes[closes.length - 8] : 0;

  const feats: number[] = [
    lastClose,
    mean(last5),
    mean(last20),
    std(last20),
    momentum3,
    momentum8,
    ema(last5, 5),
    ema(closes.slice(-10), 10),
    mean(lastReturns5),
    std(lastReturns20),
  ];

  return normalizeZscore(feats);
}

function normalizeBackend(value: string): FeatureBackend {
  if (value === 'cpu') return 'cpu';
  if (value === 'webgpu') return 'webgpu';
  return 'auto';
}

export async function buildFeaturesWithBackend(
  tail: TailPoint[],
  backend: FeatureBackend = normalizeBackend(FEATURE_BACKEND_PREF),
): Promise<{ features: Float32Array; backend: 'cpu' | 'webgpu' }> {
  if (backend === 'cpu') {
    return { features: buildFeatures(tail), backend: 'cpu' };
  }

  const canUseWebGpu = isWebGpuSupported();
  const normalization = MODEL.normalization;
  const canNormalize = normalization?.type === 'zscore';

  if (
    (backend === 'webgpu' || backend === 'auto') &&
    canUseWebGpu &&
    canNormalize
  ) {
    try {
      const features = await buildFeaturesGpu(tail);
      return { features, backend: 'webgpu' };
    } catch (_err) {
      // fallback to CPU below
    }
  }

  return { features: buildFeatures(tail), backend: 'cpu' };
}
