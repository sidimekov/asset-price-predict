/* global MessageEvent */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TailPoint } from '@/workers/ml-worker';

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
}

describe('mlWorkerClient.inferForecast', () => {
  let workerInstance: MockWorker;
  // @ts-ignore
  let WorkerCtorMock: vi.Mock;

  beforeEach(async () => {
    workerInstance = new MockWorker();
    WorkerCtorMock = vi.fn(() => workerInstance as any);

    // подменяем глобальный Worker
    vi.stubGlobal('Worker', WorkerCtorMock);

    vi.resetModules(); // убедиться, что mlWorkerClient подхватит новый Worker
  });

  it('sends infer request to worker and resolves on onnx:infer:done', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];
    const horizon = 3;

    const promise = inferForecast(tail, horizon, 'my-model');

    // даём коду возможность вызвать postMessage
    await Promise.resolve();

    expect(WorkerCtorMock).toHaveBeenCalledTimes(1);
    expect(workerInstance.lastMessage).toBeDefined();

    const sent = workerInstance.lastMessage;
    expect(sent.type).toBe('infer');
    expect(sent.payload.tail).toEqual(tail);
    expect(sent.payload.horizon).toBe(horizon);
    expect(sent.payload.model).toBe('my-model');

    // эмулируем успешный ответ воркера
    workerInstance.emitMessage({
      id: sent.id,
      type: 'onnx:infer:done',
      payload: {
        p50: [1, 2, 3],
        p10: [0.9, 1.9, 2.9],
        p90: [1.1, 2.1, 3.1],
        diag: {
          runtime_ms: 12.34,
          backend: 'mock',
          model_ver: 'mock-v0',
        },
      },
    });

    const result = await promise;

    expect(result.p50).toEqual([1, 2, 3]);
    expect(result.p10).toEqual([0.9, 1.9, 2.9]);
    expect(result.p90).toEqual([1.1, 2.1, 3.1]);
    expect(result.diag.backend).toBe('mock');
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
      payload: { message: 'Worker failed' },
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
