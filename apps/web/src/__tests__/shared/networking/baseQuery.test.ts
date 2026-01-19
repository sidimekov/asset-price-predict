import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type HeadersInstance = InstanceType<typeof globalThis.Headers>;

const { relativeQueryFn, absoluteQueryFn, captured } =
  vi.hoisted(() => ({
    relativeQueryFn: vi.fn(),
    absoluteQueryFn: vi.fn(),
    captured: {
      prepareHeaders: undefined as
        | ((headers: HeadersInstance) => HeadersInstance)
        | undefined,
    },
  }));

vi.mock('@reduxjs/toolkit/query/react', () => ({
  fetchBaseQuery: (opts: { baseUrl?: string }) => {
    if (opts?.baseUrl === '') return absoluteQueryFn;
    captured.prepareHeaders = opts.prepareHeaders;
    return relativeQueryFn;
  },
}));

import { createBaseQuery, baseQuery } from '@/shared/networking/baseQuery';

describe('createBaseQuery', () => {
  beforeEach(() => {
    relativeQueryFn.mockReset();
    absoluteQueryFn.mockReset();
  });

  it('routes absolute URLs to the absolute query', async () => {
    const query = createBaseQuery('/api/market');
    absoluteQueryFn.mockResolvedValue({ data: 'abs' });

    await query('https://example.com/foo', {} as any, {} as any);

    expect(absoluteQueryFn).toHaveBeenCalledTimes(1);
    expect(relativeQueryFn).not.toHaveBeenCalled();
  });

  it('routes relative URLs to the relative query', async () => {
    const query = createBaseQuery('/api/market');
    relativeQueryFn.mockResolvedValue({ data: 'rel' });

    await query('/symbols', {} as any, {} as any);

    expect(relativeQueryFn).toHaveBeenCalledTimes(1);
    expect(absoluteQueryFn).not.toHaveBeenCalled();
  });

  it('prepareHeaders adds auth and default content-type', () => {
    const originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = {
      getItem: vi.fn(() => 'token-123'),
    };

    const headers = new globalThis.Headers();
    const prepared = captured.prepareHeaders?.(headers);

    expect(prepared?.get('authorization')).toBe('Bearer token-123');
    expect(prepared?.get('content-type')).toBe('application/json');

    (globalThis as any).localStorage = originalLocalStorage;
  });

  it('prepareHeaders skips auth and keeps existing content-type', () => {
    const originalLocalStorage = (globalThis as any).localStorage;
    delete (globalThis as any).localStorage;

    const headers = new globalThis.Headers({ 'content-type': 'text/plain' });
    const prepared = captured.prepareHeaders?.(headers);

    expect(prepared?.get('authorization')).toBeNull();
    expect(prepared?.get('content-type')).toBe('text/plain');

    (globalThis as any).localStorage = originalLocalStorage;
  });
});

describe('baseQuery', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    relativeQueryFn.mockReset();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns normalized errors for failed requests', async () => {
    relativeQueryFn.mockResolvedValue({
      error: { status: 400, data: { message: 'Bad', code: 'bad' } },
    });

    const result = await baseQuery('/auth/login', {} as any, {} as any);

    expect(result).toEqual({
      error: { status: 400, message: 'Bad', code: 'bad' },
    });
  });

  it('returns data + meta for successful requests', async () => {
    const meta = { response: { status: 200 } };
    relativeQueryFn.mockResolvedValue({ data: { ok: true }, meta });

    const result = await baseQuery({ url: '/health' }, {} as any, {} as any);

    expect(result).toEqual({ data: { ok: true }, meta });
  });

  it('logs request info in development', async () => {
    process.env.NODE_ENV = 'development';
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    relativeQueryFn.mockResolvedValue({
      data: { ok: true },
      meta: { response: { status: 201 } },
    });

    await baseQuery({ url: '/forecast', method: 'post' }, {} as any, {} as any);

    expect(debugSpy).toHaveBeenCalledWith(
      '[Networking]',
      'POST',
      '/forecast',
      201,
    );

    debugSpy.mockRestore();
  });

  it('logs GET for string args and error status', async () => {
    process.env.NODE_ENV = 'development';
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    relativeQueryFn.mockResolvedValue({
      error: { status: 503, data: { message: 'Down' } },
    });

    await baseQuery('/ping', {} as any, {} as any);

    expect(debugSpy).toHaveBeenCalledWith('[Networking]', 'GET', '/ping', 503);

    debugSpy.mockRestore();
  });
});
