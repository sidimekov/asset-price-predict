/* global Worker, MessageEvent, AbortSignal */

import type {
  TailPoint,
  InferRequest,
  InferDoneMessage,
  InferErrorMessage,
} from '@/workers/ml-worker';

type InferResult = InferDoneMessage['payload'];

type Pending = {
  resolve: (value: InferResult) => void;
  reject: (reason?: any) => void;
};

let workerInstance: Worker | null = null;
const pendingMap = new Map<string, Pending>();

function createWorker(): Worker {
  const w = new Worker(new URL('../../workers/ml-worker.ts', import.meta.url), {
    type: 'module',
  });

  w.onmessage = (event: MessageEvent<InferDoneMessage | InferErrorMessage>) => {
    const msg = event.data as any;
    const { id, type } = msg;
    const pending = pendingMap.get(id);
    if (!pending) return;

    if (type === 'onnx:infer:done') {
      pending.resolve((msg as InferDoneMessage).payload);
    } else if (type === 'error') {
      pending.reject(new Error((msg as InferErrorMessage).payload.message));
    } else {
      pending.reject(new Error(`Unknown worker message type: ${type}`));
    }

    pendingMap.delete(id);
  };

  return w;
}

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = createWorker();
  }
  return workerInstance;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export async function inferForecast(
  tail: TailPoint[],
  horizon: number,
  model?: string | null,
  opts: { signal?: AbortSignal } = {},
): Promise<InferResult> {
  if (!tail.length || horizon <= 0) {
    throw new Error('Invalid tail or horizon for inference');
  }

  const { signal } = opts;
  if (signal?.aborted) {
    const e = new Error('Aborted');
    (e as any).name = 'AbortError';
    throw e;
  }

  const worker = getWorker();
  const id = generateRequestId();

  const req: InferRequest = {
    id,
    type: 'infer',
    payload: {
      tail,
      horizon,
      model,
    },
  };

  const p = new Promise<InferResult>((resolve, reject) => {
    pendingMap.set(id, { resolve, reject });

    if (signal) {
      const onAbort = () => {
        if (pendingMap.has(id)) {
          pendingMap.delete(id);
          const e = new Error('Aborted');
          (e as any).name = 'AbortError';
          reject(e);
        }
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });

  worker.postMessage(req);
  return p;
}
