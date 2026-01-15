import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { HttpError } from './types';

type ErrorPayload = FetchBaseQueryError | SerializedError;

type BackendErrorData = {
  message?: string;
  error?: string;
  code?: string;
};

const isBackendErrorData = (data: unknown): data is BackendErrorData => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const candidate = data as BackendErrorData;
  return (
    typeof candidate.message === 'string' ||
    typeof candidate.error === 'string' ||
    typeof candidate.code === 'string'
  );
};

const pickMessage = (data: unknown, fallback: string) => {
  if (isBackendErrorData(data)) {
    return data.message ?? data.error ?? fallback;
  }

  if (typeof data === 'string' && data.trim().length > 0) {
    return data;
  }

  return fallback;
};

const errorFromFetchError = (error: string | undefined): HttpError => {
  const normalized = error?.toLowerCase() ?? '';

  if (normalized.includes('timeout')) {
    return { status: 0, message: 'Request timeout', code: 'timeout' };
  }

  if (normalized.includes('abort')) {
    return { status: 0, message: 'Request aborted', code: 'aborted' };
  }

  return { status: 0, message: 'Network error', code: 'network_error' };
};

export const normalizeHttpError = (error: ErrorPayload): HttpError => {
  if ('status' in error) {
    if (typeof error.status === 'number') {
      return {
        status: error.status,
        message: pickMessage(error.data, 'Request failed'),
        code: isBackendErrorData(error.data) ? error.data.code : undefined,
      };
    }

    if (error.status === 'FETCH_ERROR') {
      return errorFromFetchError(error.error);
    }

    if (error.status === 'PARSING_ERROR') {
      return {
        status: error.originalStatus,
        message: 'Failed to parse server response',
        code: 'parsing_error',
      };
    }

    if (error.status === 'CUSTOM_ERROR') {
      return {
        status: 0,
        message: error.error ?? 'Unexpected error',
        code: 'custom_error',
      };
    }
  }

  return {
    status: 0,
    message: error.message ?? 'Unknown error',
    code: 'unknown_error',
  };
};
