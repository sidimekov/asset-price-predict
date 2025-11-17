// mock ml worker

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
      backend: 'mock';
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

ctx.onmessage = (event: MessageEvent<InferRequest>) => {
  const { id, type, payload } = event.data;

  if (type !== 'infer') {
    ctx.postMessage({
      id,
      type: 'error',
      payload: { message: `Unsupported message type: ${type}` },
    } as InferErrorMessage);
    return;
  }

  const t0 = performance.now();

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

    const lastClose = tail[tail.length - 1][1];

    const p50: number[] = [];
    const p10: number[] = [];
    const p90: number[] = [];

    for (let i = 0; i < horizon; i++) {
      const drift = (i + 1) * 0.05; // небольшой тренд
      const base = lastClose + drift;
      p50.push(base);
      p10.push(base * 0.99);
      p90.push(base * 1.01);
    }

    const t1 = performance.now();

    const msg: InferDoneMessage = {
      id,
      type: 'onnx:infer:done',
      payload: {
        p50,
        p10,
        p90,
        diag: {
          runtime_ms: t1 - t0,
          backend: 'mock',
          model_ver: model || 'mock-v0',
        },
      },
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
