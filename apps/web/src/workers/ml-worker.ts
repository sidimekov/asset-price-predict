/* eslint-env worker */
/* global performance */
/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web';
import { forecastMinimalConfig } from '@/config/ml';

import { buildFeatures } from './featurePipeline';
import { postprocessDelta } from './postprocess';
import type {
  InferRequestMessage,
  InferDoneMessage,
  InferErrorMessage,
} from './types';

const ctx = self as DedicatedWorkerGlobalScope;
const MODEL = forecastMinimalConfig;

// простой доверительный коридор вокруг p50 (пока нет настоящих p10/p90)
const BAND = 0.01; // +/-1%

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function setOrtEnv() {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;

  ort.env.wasm.wasmPaths =
    ort.env.wasm.wasmPaths ||
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/';
}

async function getSession(): Promise<ort.InferenceSession> {
  if (sessionPromise) return sessionPromise;

  setOrtEnv();

  const candidates = MODEL.quantPath
    ? [MODEL.quantPath, MODEL.path]
    : [MODEL.path];

  sessionPromise = (async () => {
    let lastError: unknown;

    for (const candidate of candidates) {
      try {
        return await ort.InferenceSession.create(candidate, {
          executionProviders: ['wasm'], // webgpu позже
        });
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Unable to load ONNX session');
  })();

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

ctx.addEventListener(
  'message',
  async (event: MessageEvent<InferRequestMessage>) => {
    const { id, type, payload } = event.data;

    if (type !== 'infer:request') {
      postError(id, 'EBADINPUT', `Unsupported message type: ${type}`);
      return;
    }

    const t0 = performance.now();

    try {
      const { tail, horizon, model } = payload;

      if (!tail || tail.length === 0 || horizon <= 0) {
        postError(id, 'EBADINPUT', 'Invalid tail or horizon');
        return;
      }

      if (model && model !== MODEL.modelVer) {
        postError(id, 'EBADINPUT', `Unsupported model version: ${model}`);
        return;
      }
      // 1) features
      const features = buildFeatures(tail);

      // 2) session
      const session = await getSession();

      // 3) run
      const inputName = (session as any).inputNames?.[0] ?? 'input';
      const inputTensor = new ort.Tensor('float32', features, MODEL.inputShape);

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
            backend: 'wasm',
            model_ver: MODEL.modelVer,
          },
        },
      };

      ctx.postMessage(msg);
    } catch (e: any) {
      const message = e?.message || 'ML worker runtime error';
      if (
        String(message).toLowerCase().includes('load') ||
        String(message).toLowerCase().includes('onnx')
      ) {
        postError(id, 'ELOAD', message);
        return;
      }
      postError(id, 'ERUNTIME', message);
    }
  },
);
