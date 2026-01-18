import { describe, expect, it } from 'vitest';
import { normalizeHttpError } from '@/shared/networking/errors';

describe('normalizeHttpError', () => {
  it('handles backend error payloads with a message and code', () => {
    const result = normalizeHttpError({
      status: 400,
      data: { message: 'Invalid request', code: 'bad_request' },
    });

    expect(result).toEqual({
      status: 400,
      message: 'Invalid request',
      code: 'bad_request',
    });
  });

  it('uses fallback message with backend code-only payloads', () => {
    const result = normalizeHttpError({
      status: 418,
      data: { code: 'teapot' },
    });

    expect(result).toEqual({
      status: 418,
      message: 'Request failed',
      code: 'teapot',
    });
  });

  it('uses backend error field when provided', () => {
    const result = normalizeHttpError({
      status: 500,
      data: { error: 'Server down' },
    });

    expect(result).toEqual({
      status: 500,
      message: 'Server down',
      code: undefined,
    });
  });

  it('prefers string responses for messages when no backend payload exists', () => {
    const result = normalizeHttpError({
      status: 502,
      data: 'Service unavailable',
    });

    expect(result).toEqual({
      status: 502,
      message: 'Service unavailable',
      code: undefined,
    });
  });

  it('maps fetch errors to normalized network codes', () => {
    const timeout = normalizeHttpError({
      status: 'FETCH_ERROR',
      error: 'Timeout reached',
    });

    const aborted = normalizeHttpError({
      status: 'FETCH_ERROR',
      error: 'AbortError',
    });

    const other = normalizeHttpError({
      status: 'FETCH_ERROR',
      error: 'Socket hang up',
    });

    expect(timeout).toEqual({
      status: 0,
      message: 'Request timeout',
      code: 'timeout',
    });

    expect(aborted).toEqual({
      status: 0,
      message: 'Request aborted',
      code: 'aborted',
    });

    expect(other).toEqual({
      status: 0,
      message: 'Network error',
      code: 'network_error',
    });
  });

  it('handles parsing and custom errors explicitly', () => {
    const parsing = normalizeHttpError({
      status: 'PARSING_ERROR',
      originalStatus: 503,
      data: 'broken',
      error: 'Invalid JSON',
    });

    const custom = normalizeHttpError({
      status: 'CUSTOM_ERROR',
      error: 'Oops',
    });

    expect(parsing).toEqual({
      status: 503,
      message: 'Failed to parse server response',
      code: 'parsing_error',
    });

    expect(custom).toEqual({
      status: 0,
      message: 'Oops',
      code: 'custom_error',
    });
  });

  it('falls back to serialized error messages', () => {
    const result = normalizeHttpError({ message: 'Unknown failure' });

    expect(result).toEqual({
      status: 0,
      message: 'Unknown failure',
      code: 'unknown_error',
    });
  });

  it('handles unknown status variants with defaults', () => {
    const result = normalizeHttpError({
      status: 'UNKNOWN' as any,
    });

    expect(result).toEqual({
      status: 0,
      message: 'Request failed',
      code: 'unknown_error',
    });
  });
});
