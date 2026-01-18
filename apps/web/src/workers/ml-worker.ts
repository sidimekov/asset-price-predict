/* global self, MessageEvent, performance */

import * as ort from 'onnxruntime-web';
import { getModelConfig, type ForecastModelConfig } from '@/config/ml';

export type TailPoint = [ts: number, close: number];

export type InferRequest = {
  id: string;
  type: 'infer';
  payload: {
    tail: TailPoint[];
    horizon: number;
    model?: string | null;
  };
};

export type InferDoneMessage = {
  id: string;
  type: 'onnx:infer:done';
  payload: {
    p50: number[];
    p10: number[];
    p90: number[];
    diag: {
      runtime_ms: number;
      backend: 'onnx-wasm' | 'mock';
      model_ver: string;
    };
  };
};

export type InferErrorMessage = {
  id: string;
  type: 'error';
  payload: {
    message: string;
  };
};

const ctx: any = self;
const BAND = 0.01; // +/-1% confidence band from median

const sessionCache = new Map<string, Promise<ort.InferenceSession>>();

function ema(values: number[], span: number): number {
  const alpha = 2 / (span + 1);
  return values.reduce(
    (acc, v) => alpha * v + (1 - alpha) * acc,
    values[0] ?? 0,
  );
}

function normalize(
  features: number[],
  model: ForecastModelConfig,
): Float32Array {
  const norm = model.normalization;
  if (norm.type !== 'zscore') {
    return Float32Array.from(features);
  }
  return Float32Array.from(
    features.map((value, idx) => {
      const std = norm.std[idx] ?? 1;
      const mean = norm.mean[idx] ?? 0;
      return (value - mean) / (std + norm.epsilon);
    }),
  );
}

function buildFeatures(
  tail: TailPoint[],
  model: ForecastModelConfig,
): Float32Array {
  if (tail.length < model.featureWindow) {
    throw new Error(
      `Tail too short: expected ${model.featureWindow}, got ${tail.length}`,
    );
  }

  const closes = tail
    .slice(-model.featureWindow)
    .map(([, close]) => close);
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    returns.push(prev === 0 ? 0 : (curr - prev) / prev);
  }

  const feats: number[] = [];
  feats.push(closes[closes.length - 1]);
  feats.push(closes.slice(-5).reduce((a, b) => a + b, 0) / 5);
  feats.push(closes.slice(-20).reduce((a, b) => a + b, 0) / 20);
  const std20 = closes.slice(-20);
  const mean20 = std20.reduce((a, b) => a + b, 0) / 20;
  feats.push(
    Math.sqrt(
      std20.reduce((acc, v) => acc + (v - mean20) * (v - mean20), 0) /
        std20.length,
    ),
  );
  feats.push(closes[closes.length - 1] - closes[closes.length - 3]);
  feats.push(closes[closes.length - 1] - closes[closes.length - 8]);
  feats.push(ema(closes.slice(-5), 5));
  feats.push(ema(closes.slice(-10), 10));
  const lastReturns5 = returns.slice(-5);
  feats.push(lastReturns5.reduce((a, b) => a + b, 0) / 5);
  const lastReturns20 = returns.slice(-20);
  const meanRet20 =
    lastReturns20.reduce((a, b) => a + b, 0) / lastReturns20.length;
  const varRet20 =
    lastReturns20.reduce(
      (acc, v) => acc + (v - meanRet20) * (v - meanRet20),
      0,
    ) / lastReturns20.length;
  feats.push(Math.sqrt(varRet20));

  return normalize(feats, model);
}

function setOrtEnv() {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;
  ort.env.wasm.wasmPaths =
    ort.env.wasm.wasmPaths ||
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/';
}

async function getSession(
  model: ForecastModelConfig,
): Promise<ort.InferenceSession> {
  const key = model.modelVer;
  const cached = sessionCache.get(key);
  if (cached) return cached;

  setOrtEnv();
  const candidates = model.quantPath ? [model.quantPath, model.path] : [model.path];

  const promise = (async () => {
    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        return await ort.InferenceSession.create(candidate, {
          executionProviders: ['wasm'],
        });
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Unable to load ONNX session');
  })();

  sessionCache.set(key, promise);
  return promise;
}

async function runOnnx(
  tail: TailPoint[],
  horizon: number,
  model: ForecastModelConfig,
): Promise<InferDoneMessage['payload']> {
  const session = await getSession(model);

  const lastClose = tail[tail.length - 1][1];
  const features = buildFeatures(tail, model);
  const input = new ort.Tensor('float32', features, model.inputShape);

  const t0 = performance.now();
  const output = await session.run({ input });
  const t1 = performance.now();

  const delta = Array.from(output.delta.data as Float32Array);
  const limit = Math.min(horizon, delta.length);
  const p50 = delta.slice(0, limit).map((d) => d + lastClose);
  const p10 = p50.map((v) => v * (1 - BAND));
  const p90 = p50.map((v) => v * (1 + BAND));

  return {
    p50,
    p10,
    p90,
    diag: {
      runtime_ms: t1 - t0,
      backend: 'onnx-wasm',
      model_ver: model.modelVer,
    },
  };
}

function runFallback(
  tail: TailPoint[],
  horizon: number,
  model: ForecastModelConfig,
): InferDoneMessage['payload'] {
  const lastClose = tail[tail.length - 1][1];
  const p50: number[] = [];
  const p10: number[] = [];
  const p90: number[] = [];
  for (let i = 0; i < horizon; i++) {
    const drift = (i + 1) * 0.05;
    const base = lastClose + drift;
    p50.push(base);
    p10.push(base * (1 - BAND));
    p90.push(base * (1 + BAND));
  }
  return {
    p50,
    p10,
    p90,
    diag: {
      runtime_ms: 0,
      backend: 'mock',
      model_ver: model.modelVer,
    },
  };
}

ctx.onmessage = async (event: MessageEvent<InferRequest>) => {
  const { id, type, payload } = event.data;

  if (type !== 'infer') {
    ctx.postMessage({
      id,
      type: 'error',
      payload: { message: `Unsupported message type: ${type}` },
    } as InferErrorMessage);
    return;
  }

  try {
    const { tail, horizon, model } = payload;
    if (!tail.length || horizon <= 0) {
      ctx.postMessage({
        id,
        type: 'error',
        payload: { message: 'Invalid tail or horizon' },
      } as InferErrorMessage);
      return;
    }

    const modelConfig = getModelConfig(model);
    if (model && modelConfig.modelVer !== model) {
      ctx.postMessage({
        id,
        type: 'error',
        payload: { message: `Unsupported model version: ${model}` },
      } as InferErrorMessage);
      return;
    }

    let result: InferDoneMessage['payload'];
    try {
      result = await runOnnx(tail, horizon, modelConfig);
    } catch (err) {
      console.error('[ml-worker] ONNX inference failed, fallback to mock', err);
      result = runFallback(tail, horizon, modelConfig);
    }

    const msg: InferDoneMessage = {
      id,
      type: 'onnx:infer:done',
      payload: result,
    };

    ctx.postMessage(msg);
  } catch (e: any) {
    ctx.postMessage({
      id,
      type: 'error',
      payload: { message: e?.message || 'Worker error' },
    } as InferErrorMessage);
  }
};
