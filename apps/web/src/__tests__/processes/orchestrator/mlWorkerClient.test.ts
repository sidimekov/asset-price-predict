import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TailPoint } from '@/workers/ml-worker';
import { inferForecast } from '@/processes/orchestrator/mlWorkerClient';

class MockWorker {
  public onmessage: ((event: MessageEvent<any>) => void) | null = null;
  public lastMessage: any = null;

  constructor() {}

  postMessage(data: any) {
    this.lastMessage = data;
  }

  // helper для теста
  emitMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent<any>);
    }
  }
}

describe('mlWorkerClient.inferForecast', () => {
  let WorkerSpy: any;
  let workerInstance: MockWorker;

  beforeEach(() => {
    workerInstance = new MockWorker();

    WorkerSpy = vi
      .spyOn(globalThis as any, 'Worker')
      .mockImplementation(() => workerInstance as any);
  });

  it('sends infer request to worker and resolves on onnx:infer:done', async () => {
    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];
    const horizon = 3;

    const promise = inferForecast(tail, horizon, 'my-model');

    // проверяем, что postMessage вызван с правильной структурой
    expect(workerInstance.lastMessage).toBeNull();

    // после вызова inferForecast должна быть отправка сообщения
    // (сам вызов postMessage происходит синхронно до первого await)
    // поэтому ждём один такт event loop
    await Promise.resolve();

    expect(workerInstance.lastMessage).toBeDefined();
    const sent = workerInstance.lastMessage;
    expect(sent.type).toBe('infer');
    expect(sent.payload.tail).toEqual(tail);
    expect(sent.payload.horizon).toBe(horizon);
    expect(sent.payload.model).toBe('my-model');

    // теперь эмулируем ответ воркера
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
    expect(result.diag.model_ver).toBe('mock-v0');

    expect(WorkerSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects when worker sends error message', async () => {
    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];

    const promise = inferForecast(tail, 2, null);

    await Promise.resolve();
    const sent = workerInstance.lastMessage;

    // эмулируем ошибку
    workerInstance.emitMessage({
      id: sent.id,
      type: 'error',
      payload: { message: 'Worker failed' },
    });

    await expect(promise).rejects.toThrow('Worker failed');
  });

  it('throws on invalid tail or horizon', async () => {
    await expect(inferForecast([], 0)).rejects.toThrow(
      'Invalid tail or horizon for inference',
    );
  });
});
