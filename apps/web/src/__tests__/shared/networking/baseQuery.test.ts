import { describe, it, expect, vi } from 'vitest';
import { createBaseQuery, baseQuery } from '@/shared/networking/baseQuery';

vi.mock('@reduxjs/toolkit/query/react', () => {
  const fetchBaseQuery = vi.fn((config) => {
    const handler = vi.fn(async (args) => {
      const url = typeof args === 'string' ? args : args.url;
      if (url.includes('fail')) {
        return {
          error: {
            status: 500,
            message: 'boom',
          },
        };
      }
      return {
        data: {
          baseUrl: config.baseUrl,
          url,
        },
      };
    });
    return handler;
  });

  return { fetchBaseQuery };
});

describe('createBaseQuery', () => {
  it('returns a baseQuery function', () => {
    const baseQueryFn = createBaseQuery('/api/market');
    expect(typeof baseQueryFn).toBe('function');
  });

  it('routes relative urls to the baseUrl handler', async () => {
    const query = createBaseQuery('/api');
    const result = await query('/prices');
    expect(result).toEqual({
      data: {
        baseUrl: '/api',
        url: '/prices',
      },
    });
  });

  it('routes absolute urls to the empty-base handler', async () => {
    const query = createBaseQuery('/api');
    const result = await query('https://example.com/values');
    expect(result).toEqual({
      data: {
        baseUrl: '',
        url: 'https://example.com/values',
      },
    });
  });
});

describe('baseQuery', () => {
  it('normalizes fetch errors into the structured error response', async () => {
    const result = await baseQuery({ url: '/fail' });
    expect(result.error).toEqual({
      status: 500,
      message: 'Request failed',
    });
  });
});
