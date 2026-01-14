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

    vi.stubGlobal('Worker', WorkerCtorMock);

    vi.resetModules();
  });

  it('sends infer request to worker and resolves on onnx:infer:done', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];

    const promise = inferForecast(tail, 3, 'my-model');

    await Promise.resolve();

    expect(WorkerCtorMock).toHaveBeenCalledTimes(1);

    const sent = workerInstance.lastMessage;
    expect(sent.type).toBe('infer');
    expect(sent.payload.tail).toEqual(tail);
    expect(sent.payload.horizon).toBe(3);
    expect(sent.payload.model).toBe('my-model');

    workerInstance.emitMessage({
      id: sent.id,
      type: 'onnx:infer:done',
      payload: {
        p50: [1, 2, 3],
        p10: [0.9, 1.9, 2.9],
        p90: [1.1, 2.1, 3.1],
        diag: { runtime_ms: 12.34, backend: 'mock', model_ver: 'mock-v0' },
      },
    });

    const result = await promise;
    expect(result.p50).toEqual([1, 2, 3]);
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

  it('rejects on unknown worker message type', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];

    const promise = inferForecast(tail, 2, 'm');

    await Promise.resolve();
    const sent = workerInstance.lastMessage;

    workerInstance.emitMessage({
      id: sent.id,
      type: 'weird:type',
      payload: {},
    });

    await expect(promise).rejects.toThrow('Unknown worker message type');
  });

  it('throws on invalid tail or horizon', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    await expect(inferForecast([], 0)).rejects.toThrow(
      'Invalid tail or horizon for inference',
    );
  });

  it('throws AbortError immediately when signal already aborted', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    const ac = new AbortController();
    ac.abort();

    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];

    await expect(
      inferForecast(tail, 2, 'm', { signal: ac.signal }),
    ).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('rejects with AbortError when aborted after scheduling', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
    );

    const ac = new AbortController();

    const tail: TailPoint[] = [
      [1, 100],
      [2, 101],
    ];

    const promise = inferForecast(tail, 2, 'm', { signal: ac.signal });

    await Promise.resolve();
    ac.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
