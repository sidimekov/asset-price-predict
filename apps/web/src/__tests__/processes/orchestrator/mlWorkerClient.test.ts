/* global MessageEvent */

import { describe, it, expect, vi, beforeEach } from 'vitest';

type TailPoint = [number, number];

class MockWorker {
  public onmessage: ((event: MessageEvent<any>) => void) | null = null;
  public lastMessage: any = null;

  postMessage(data: any) {
    this.lastMessage = data;
  }

  emitMessage(data: any) {
    this.onmessage?.({ data } as MessageEvent<any>);
  }

  terminate() {}
}

describe('mlWorkerClient.inferForecast', () => {
  let workerInstance: MockWorker;
  let WorkerCtorMock: vi.Mock;

  beforeEach(async () => {
    workerInstance = new MockWorker();
    WorkerCtorMock = vi.fn(() => workerInstance as any);

    vi.stubGlobal('Worker', WorkerCtorMock);

    // важно: чтобы mlWorkerClient подхватил новый Worker после stubGlobal
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

    const promise = inferForecast(tail, 3, 'my-model');

    await Promise.resolve();

    expect(WorkerCtorMock).toHaveBeenCalledTimes(1);

    const sent = workerInstance.lastMessage;
    expect(sent.type).toBe('infer:request');
    expect(sent.payload.tail).toEqual(tail);
    expect(sent.payload.horizon).toBe(3);
    expect(sent.payload.model).toBe('my-model');

    workerInstance.emitMessage({
      id: sent.id,
      type: 'infer:done',
      payload: {
        p50: [1, 2, 3],
        p10: [0.9, 1.9, 2.9],
        p90: [1.1, 2.1, 3.1],
        diag: { runtime_ms: 12.34, backend: 'wasm', model_ver: 'mock-v0' },
      },
    });

    const result = await promise;
    expect(result.p50).toEqual([1, 2, 3]);
    expect(result.p10).toEqual([0.9, 1.9, 2.9]);
    expect(result.p90).toEqual([1.1, 2.1, 3.1]);
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

  it('reuses singleton Worker instance (does not create new Worker on 2nd call)', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
      );

    const p1 = inferForecast(
      [
        [1, 10],
        [2, 11],
      ],
      2,
      'm1',
    );

    await Promise.resolve();
    const firstSent = workerInstance.lastMessage;

    const p2 = inferForecast(
      [
        [1, 20],
        [2, 21],
      ],
      2,
      'm2',
    );

    await Promise.resolve();
    const secondSent = workerInstance.lastMessage;

    expect(WorkerCtorMock).toHaveBeenCalledTimes(1);
    expect(firstSent.id).not.toBe(secondSent.id);

    workerInstance.emitMessage({
      id: firstSent.id,
      type: 'infer:done',
      payload: {
        p50: [1, 2],
        diag: { runtime_ms: 1, backend: 'wasm', model_ver: 'x' },
      },
    });

    workerInstance.emitMessage({
      id: secondSent.id,
      type: 'infer:done',
      payload: {
        p50: [3, 4],
        diag: { runtime_ms: 2, backend: 'wasm', model_ver: 'y' },
      },
    });

    const r1 = await p1;
    const r2 = await p2;

    expect(r1.p50).toEqual([1, 2]);
    expect(r2.p50).toEqual([3, 4]);
  });

  it('ignores messages with unknown id and still resolves on correct id', async () => {
    const { inferForecast } = await import(
      '@/processes/orchestrator/mlWorkerClient'
      );

    const promise = inferForecast(
      [
        [1, 100],
        [2, 101],
      ],
      2,
      'm',
    );

    await Promise.resolve();
    const sent = workerInstance.lastMessage;

    workerInstance.emitMessage({
      id: 'some_other_id',
      type: 'infer:done',
      payload: {
        p50: [999],
        diag: { runtime_ms: 1, backend: 'wasm', model_ver: 'bad' },
      },
    });

    workerInstance.emitMessage({
      id: sent.id,
      type: 'infer:done',
      payload: {
        p50: [1, 2],
        diag: { runtime_ms: 1, backend: 'wasm', model_ver: 'ok' },
      },
    });

    const result = await promise;
    expect(result.p50).toEqual([1, 2]);
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
