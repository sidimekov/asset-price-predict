/* eslint-env worker */
/* global performance */
/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web';
import {
  DEFAULT_MODEL_VER,
  getModelConfig,
  resolveModelVersion,
} from '@/config/ml';

import {
  buildFeaturesWithBackend,
  type FeatureBackend,
} from './featurePipeline';
import { postprocessDelta } from './postprocess';
import type {
  InferRequestMessage,
  InferDoneMessage,
  InferErrorMessage,
} from './types';

const ctx = self as DedicatedWorkerGlobalScope;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const BACKEND_PREF = (
  process.env.NEXT_PUBLIC_ORT_BACKEND || 'auto'
).toLowerCase();

const FEATURES_BACKEND_PREF = (
  process.env.NEXT_PUBLIC_FEATURES_BACKEND || 'auto'
).toLowerCase();

// простой доверительный коридор вокруг p50 (пока нет настоящих p10/p90)
const BAND = 0.01; // +/-1%

type SessionInfo = {
  session: ort.InferenceSession;
  backend: 'webgpu' | 'wasm';
};

const sessionPromises = new Map<string, Promise<SessionInfo>>();
let runQueue = Promise.resolve();

function setOrtEnv() {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;

  ort.env.wasm.wasmPaths =
    ort.env.wasm.wasmPaths || `${BASE_PATH}/onnxruntime/`;
}

function shouldUseWebGpu(): boolean {
  if (BACKEND_PREF === 'wasm') return false;
  if (BACKEND_PREF === 'webgpu') return true;
  return Boolean((ctx as any).navigator?.gpu);
}

async function tryCreateSession(
  provider: 'webgpu' | 'wasm',
  candidates: string[],
): Promise<ort.InferenceSession | null> {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return await ort.InferenceSession.create(candidate, {
        executionProviders: [provider],
      });
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}

async function getSession(modelVer: string): Promise<SessionInfo> {
  const existing = sessionPromises.get(modelVer);
  if (existing) return existing;

  setOrtEnv();

  const modelConfig = getModelConfig(modelVer);
  const candidates = modelConfig.quantPath
    ? [modelConfig.quantPath, modelConfig.path]
    : [modelConfig.path];

  const sessionPromise = (async () => {
    const useWebGpu = shouldUseWebGpu();
    let lastError: unknown;

    if (useWebGpu) {
      try {
        const session = await tryCreateSession('webgpu', candidates);
        if (session) {
          return { session, backend: 'webgpu' };
        }
      } catch (err) {
        lastError = err;
      }
    }

    try {
      const session = await tryCreateSession('wasm', candidates);
      if (session) {
        return { session, backend: 'wasm' };
      }
    } catch (err) {
      lastError = err;
    }

    throw lastError || new Error('Unable to load ONNX session');
  })();

  sessionPromises.set(modelVer, sessionPromise);
  return sessionPromise;
}

function postError(
  id: string,
  code: InferErrorMessage['payload']['code'],
  message: string,
) {
  const msg: InferErrorMessage = {
    id,
    type: 'error',
    payload: { code, message },
  };
  ctx.postMessage(msg);
}

async function handleInferRequest(
  id: string,
  payload: InferRequestMessage['payload'],
): Promise<void> {
  const t0 = performance.now();
  const { tail, horizon, model } = payload;

  if (!tail || tail.length === 0 || horizon <= 0) {
    postError(id, 'EBADINPUT', 'Invalid tail or horizon');
    return;
  }

  const resolvedModelVer = resolveModelVersion(model);
  if (model && !resolvedModelVer) {
    postError(id, 'EBADINPUT', `Unsupported model version: ${model}`);
    return;
  }
  const modelVer = resolvedModelVer ?? DEFAULT_MODEL_VER;
  const modelConfig = getModelConfig(modelVer);
  // 1) features
  const { features, backend: featuresBackend } =
    await buildFeaturesWithBackend(
      tail,
      modelConfig,
      FEATURES_BACKEND_PREF as FeatureBackend,
    );

  // 2) session
  const { session, backend } = await getSession(modelConfig.modelVer);

  // 3) run
  const inputName = (session as any).inputNames?.[0] ?? 'input';
  const inputTensor = new ort.Tensor(
    'float32',
    features,
    modelConfig.inputShape,
  );

  const outMap = await session.run({ [inputName]: inputTensor });

  // 4) достаём delta (если нет delta - берём первый output)
  const outName = (outMap as any).delta
    ? 'delta'
    : ((session as any).outputNames?.[0] ?? Object.keys(outMap)[0]);

  const raw = outMap[outName]?.data as Float32Array | undefined;

  if (!raw) {
    postError(id, 'ERUNTIME', `ONNX output "${outName}" is missing`);
    return;
  }

  // 5) postprocess
  const lastClose = tail[tail.length - 1][1];
  const p50 = postprocessDelta(raw, lastClose, horizon);

  // временный p10/p90 (пока модель/постпроцесс не отдают их)
  const p10 = p50.map((v) => v * (1 - BAND));
  const p90 = p50.map((v) => v * (1 + BAND));

  const t1 = performance.now();

  const msg: InferDoneMessage = {
    id,
    type: 'infer:done',
    payload: {
      p50,
      p10,
      p90,
      diag: {
        runtime_ms: t1 - t0,
        backend,
        features_backend: featuresBackend,
        model_ver: modelConfig.modelVer,
      },
    },
  };

  ctx.postMessage(msg);
}

ctx.addEventListener(
  'message',
  (event: MessageEvent<InferRequestMessage>) => {
    const { id, type, payload } = event.data;

    if (type !== 'infer:request') {
      postError(id, 'EBADINPUT', `Unsupported message type: ${type}`);
      return;
    }

    runQueue = runQueue
      .then(() => handleInferRequest(id, payload))
      .catch((e: any) => {
        const message = e?.message || 'ML worker runtime error';
        if (
          String(message).toLowerCase().includes('load') ||
          String(message).toLowerCase().includes('onnx')
        ) {
          postError(id, 'ELOAD', message);
          return;
        }
        postError(id, 'ERUNTIME', message);
      });
  },
);
