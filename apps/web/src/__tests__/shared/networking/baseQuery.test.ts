import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

vi.mock('@reduxjs/toolkit/query/react', () => ({
  fetchBaseQuery: vi.fn(),
}));

const fetchBaseQueryMock = vi.mocked(fetchBaseQuery);

describe('baseQuery', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    fetchBaseQueryMock.mockReset();
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns data results and logs request info', async () => {
    const rawQuery = vi.fn().mockResolvedValue({
      data: { ok: true },
      meta: { response: { status: 200 } },
    });

    fetchBaseQueryMock.mockReturnValue(rawQuery);

    const { baseQuery } = await import('@/shared/networking/baseQuery');
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const result = await baseQuery('/status', {} as never, {} as never);

    expect(result).toEqual({
      data: { ok: true },
      meta: { response: { status: 200 } },
    });
    expect(rawQuery).toHaveBeenCalledWith('/status', expect.anything(), expect.anything());
    expect(debugSpy).toHaveBeenCalledWith('[Networking]', 'GET', '/status', 200);

    debugSpy.mockRestore();
  });

  it('normalizes error responses and preserves method casing', async () => {
    const rawQuery = vi.fn().mockResolvedValue({
      error: { status: 500, data: { message: 'Boom' } },
    });

    fetchBaseQueryMock.mockReturnValue(rawQuery);

    const { baseQuery } = await import('@/shared/networking/baseQuery');
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const result = await baseQuery(
      { url: '/fail', method: 'post' },
      {} as never,
      {} as never,
    );

    expect(result).toEqual({
      error: { status: 500, message: 'Boom', code: undefined },
    });
    expect(debugSpy).toHaveBeenCalledWith('[Networking]', 'POST', '/fail', 500);

    debugSpy.mockRestore();
  });
});
