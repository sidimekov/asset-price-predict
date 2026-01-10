/* global MessageEvent */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мок onnxruntime-web, чтобы тест был стабильным в CI
vi.mock('onnxruntime-web', () => {
  class Tensor {
    type: string;
    data: Float32Array;
    dims: number[];

    constructor(type: string, data: Float32Array, dims: number[]) {
      this.type = type;
      this.data = data;
      this.dims = dims;
    }
  }

  class InferenceSession {
    inputNames = ['input'];
    outputNames = ['delta'];

    static async create() {
      return new InferenceSession();
    }

    async run(_feeds: any) {
      // вернём "delta" как делает manifest
      // пусть delta будет [0.1, 0.2, 0.3]
      // worker потом сделает last_close_plus_delta и вернёт p50
      const horizon = 3;
      const delta = new Float32Array([0.1, 0.2, 0.3].slice(0, horizon));
      return {
        delta: { data: delta },
      };
    }
  }

  return {
    env: {
      wasm: {
        numThreads: 1,
        simd: true,
        wasmPaths: '',
      },
    },

    Tensor,
    InferenceSession,
  };
});

type WorkerMessage = {
  id: string;
  type: string;
  payload: any;
};

describe('ml-worker', () => {
  let postMessageMock: ReturnType<typeof vi.fn>;
  let messageHandler: ((ev: MessageEvent<any>) => void) | null;

  beforeEach(async () => {
    postMessageMock = vi.fn();
    messageHandler = null;

    // Мок self как в настоящем воркере
    vi.stubGlobal('self', {
      postMessage: postMessageMock,
      addEventListener: (type: string, cb: (ev: MessageEvent<any>) => void) => {
        if (type === 'message') messageHandler = cb;
      },
    } as any);

    // performance.now может использоваться в diag
    vi.stubGlobal('performance', {
      now: () => 123.456,
    } as any);

    // импорт воркера после установки self/performance
    vi.resetModules();
    await import('@/workers/ml-worker');

    expect(messageHandler).toBeTypeOf('function');
  });

  it('returns infer:done with p50 of correct length', async () => {
    // tail должен быть >= 20 (из-за mean_20/std_20)
    const tail: Array<[number, number]> = Array.from({ length: 64 }).map(
      (_, i) => [1700000000000 + i * 60_000, 100 + i * 0.1],
    );

    const message: WorkerMessage = {
      id: 'test-1',
      type: 'infer:request',
      payload: {
        tail,
        tf: '1m',
        horizon: 3,
        // model: 'forecast_minimal',
      },
    };

    // @ts-ignore
    await messageHandler!({ data: message } as MessageEvent);

    expect(postMessageMock).toHaveBeenCalledTimes(1);

    const response = postMessageMock.mock.calls[0][0];
    expect(response.id).toBe('test-1');
    expect(response.type).toBe('infer:done');

    expect(Array.isArray(response.payload.p50)).toBe(true);
    expect(response.payload.p50.length).toBe(3);

    expect(response.payload.diag).toBeDefined();
    expect(typeof response.payload.diag.runtime_ms).toBe('number');
    expect(typeof response.payload.diag.model_ver).toBe('string');
  });

  it('returns error on empty tail', async () => {
    const message: WorkerMessage = {
      id: 'test-empty',
      type: 'infer:request',
      payload: {
        tail: [],
        tf: '1m',
        horizon: 3,
      },
    };

    // @ts-ignore
    await messageHandler!({ data: message } as MessageEvent);

    expect(postMessageMock).toHaveBeenCalledTimes(1);

    const response = postMessageMock.mock.calls[0][0];
    expect(response.id).toBe('test-empty');
    expect(response.type).toBe('error');
    expect(response.payload.code).toBeDefined();
  });
});
