/* global MessageEvent */

import { describe, it, expect, vi, beforeEach } from 'vitest';

type TailPoint = [number, number];

// мок Worker
class MockWorker {
  public onmessage: ((event: MessageEvent<any>) => void) | null = null;
  public lastMessage: any = null;

  postMessage(data: any) {
    this.lastMessage = data;
  }

  emitMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent<any>);
    }
  }

  terminate() {}
}

describe('mlWorkerClient.inferForecast', () => {
  let workerInstance: MockWorker;
  let WorkerCtorMock: vi.Mock;

  beforeEach(async () => {
    workerInstance = new MockWorker();
    WorkerCtorMock = vi.fn(() => workerInstance as any);

    // подменяем глобальный Worker
    vi.stubGlobal('Worker', WorkerCtorMock);

    // чтобы mlWorkerClient подхватил новый Worker
    vi.resetModules();
  });

  it('sends infer:request to worker and resolves on infer:done', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];
    const horizon = 3;

    const promise = inferForecast(tail, horizon, 'my-model');

    // микротаскf выполняется, чтобы postMessage был вызван
    await Promise.resolve();

    expect(WorkerCtorMock).toHaveBeenCalledTimes(1);
    expect(workerInstance.lastMessage).toBeDefined();

    const sent = workerInstance.lastMessage;

    // новый протокол
    expect(sent.type).toBe('infer:request');
    expect(sent.payload.tail).toEqual(tail);
    expect(sent.payload.horizon).toBe(horizon);
    expect(sent.payload.model).toBe('my-model');

    // успешный ответ воркера
    workerInstance.emitMessage({
      id: sent.id,
      type: 'infer:done',
      payload: {
        p50: [1, 2, 3],
        p10: [0.9, 1.9, 2.9],
        p90: [1.1, 2.1, 3.1],
        diag: {
          runtime_ms: 12.34,
          backend: 'wasm',
          model_ver: 'mock-v0',
        },
      },
    });

    const result = await promise;

    expect(result.p50).toEqual([1, 2, 3]);
    expect(result.p10).toEqual([0.9, 1.9, 2.9]);
    expect(result.p90).toEqual([1.1, 2.1, 3.1]);
    expect(result.diag.backend).toBe('wasm');
  });

  it('rejects when worker sends error message', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];

    const promise = inferForecast(tail, 2, null);

    await Promise.resolve();
    const sent = workerInstance.lastMessage;

    workerInstance.emitMessage({
      id: sent.id,
      type: 'error',
      payload: {
        code: 'ERUNTIME',
        message: 'Worker failed',
      },
    });

    await expect(promise).rejects.toThrow('Worker failed');
  });

  it('throws on invalid tail or horizon', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    await expect(inferForecast([], 0)).rejects.toThrow(
      'Invalid tail or horizon for inference',
    );
  });
});
