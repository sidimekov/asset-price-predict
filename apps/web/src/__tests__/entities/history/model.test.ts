import { describe, it, expect } from 'vitest';
import type { HistoryEntry } from '@/entities/history/model';

// Переносим функции валидации прямо в тестовый файл
export function isValidHistoryEntry(entry: any): entry is HistoryEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    typeof entry.id === 'string' &&
    typeof entry.created_at === 'string' &&
    !isNaN(Date.parse(entry.created_at)) &&
    typeof entry.symbol === 'string' &&
    typeof entry.tf === 'string' &&
    typeof entry.horizon === 'number' &&
    typeof entry.provider === 'string' &&
    Array.isArray(entry.p50) &&
    entry.p50.every(
      (item: any) =>
        Array.isArray(item) &&
        item.length === 2 &&
        typeof item[0] === 'number' &&
        typeof item[1] === 'number',
    ) &&
    typeof entry.meta === 'object' &&
    entry.meta !== null &&
    typeof entry.meta.runtime_ms === 'number' &&
    (entry.meta.backend === 'client' || entry.meta.backend === 'server')
  );
}

export function validateHistoryEntry(entry: any): string[] {
  const errors: string[] = [];

  if (typeof entry !== 'object' || entry === null) {
    return ['Entry must be an object'];
  }

  if (typeof entry.id !== 'string') {
    errors.push('id must be a string');
  }

  if (
    typeof entry.created_at !== 'string' ||
    isNaN(Date.parse(entry.created_at))
  ) {
    errors.push('created_at must be a valid ISO date string');
  }

  if (typeof entry.symbol !== 'string') {
    errors.push('symbol must be a string');
  }

  if (typeof entry.tf !== 'string') {
    errors.push('tf must be a string');
  }

  if (typeof entry.horizon !== 'number') {
    errors.push('horizon must be a number');
  }

  if (typeof entry.provider !== 'string') {
    errors.push('provider must be a string');
  }

  if (!Array.isArray(entry.p50)) {
    errors.push('p50 must be an array');
  } else if (
    !entry.p50.every(
      (item: any) =>
        Array.isArray(item) &&
        item.length === 2 &&
        typeof item[0] === 'number' &&
        typeof item[1] === 'number',
    )
  ) {
    errors.push('p50 must contain arrays of two numbers');
  }

  if (typeof entry.meta !== 'object' || entry.meta === null) {
    errors.push('meta must be an object');
  } else {
    if (typeof entry.meta.runtime_ms !== 'number') {
      errors.push('meta.runtime_ms must be a number');
    }
    if (entry.meta.backend !== 'client' && entry.meta.backend !== 'server') {
      errors.push('meta.backend must be either "client" or "server"');
    }
  }

  return errors;
}

describe('history validation', () => {
  describe('isValidHistoryEntry', () => {
    it('возвращает true для валидного HistoryEntry', () => {
      const validEntry = {
        id: 'test-id',
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 50000]],
        meta: {
          runtime_ms: 100,
          backend: 'client',
        },
      };

      expect(isValidHistoryEntry(validEntry)).toBe(true);
    });

    it('возвращает false для null', () => {
      expect(isValidHistoryEntry(null)).toBe(false);
    });

    it('возвращает false для невалидного id', () => {
      const invalidEntry = {
        id: 123,
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 50000]],
        meta: {
          runtime_ms: 100,
          backend: 'client',
        },
      };

      expect(isValidHistoryEntry(invalidEntry)).toBe(false);
    });

    it('возвращает false для невалидного created_at', () => {
      const invalidEntry = {
        id: 'test-id',
        created_at: 'invalid-date',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 50000]],
        meta: {
          runtime_ms: 100,
          backend: 'client',
        },
      };

      expect(isValidHistoryEntry(invalidEntry)).toBe(false);
    });

    it('возвращает false для невалидного p50', () => {
      const invalidEntry = {
        id: 'test-id',
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 'string']],
        meta: {
          runtime_ms: 100,
          backend: 'client',
        },
      };

      expect(isValidHistoryEntry(invalidEntry)).toBe(false);
    });

    it('возвращает false для невалидного backend', () => {
      const invalidEntry = {
        id: 'test-id',
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 50000]],
        meta: {
          runtime_ms: 100,
          backend: 'invalid',
        },
      };

      expect(isValidHistoryEntry(invalidEntry)).toBe(false);
    });

    it('возвращает false для отсутствующего meta', () => {
      const invalidEntry = {
        id: 'test-id',
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 50000]],
        // нет meta
      };

      expect(isValidHistoryEntry(invalidEntry)).toBe(false);
    });
  });

  describe('validateHistoryEntry', () => {
    it('возвращает пустой массив для валидного HistoryEntry', () => {
      const validEntry = {
        id: 'test-id',
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 50000]],
        meta: {
          runtime_ms: 100,
          backend: 'client',
        },
      };

      expect(validateHistoryEntry(validEntry)).toEqual([]);
    });

    it('возвращает ошибку для null', () => {
      expect(validateHistoryEntry(null)).toEqual(['Entry must be an object']);
    });

    it('возвращает ошибки для невалидного HistoryEntry', () => {
      const invalidEntry = {
        id: 123,
        created_at: 'invalid-date',
        symbol: 456,
        tf: 789,
        horizon: 'not-a-number',
        provider: 999,
        p50: 'not-an-array',
        meta: 'not-an-object',
      };

      const errors = validateHistoryEntry(invalidEntry);

      expect(errors).toContain('id must be a string');
      expect(errors).toContain('created_at must be a valid ISO date string');
      expect(errors).toContain('symbol must be a string');
      expect(errors).toContain('tf must be a string');
      expect(errors).toContain('horizon must be a number');
      expect(errors).toContain('provider must be a string');
      expect(errors).toContain('p50 must be an array');
      expect(errors).toContain('meta must be an object');
    });

    it('возвращает ошибку для невалидного p50 массива', () => {
      const invalidEntry = {
        id: 'test-id',
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [
          [1000, 'string'],
          [2000, 51000],
        ],
        meta: {
          runtime_ms: 100,
          backend: 'client',
        },
      };

      const errors = validateHistoryEntry(invalidEntry);
      expect(errors).toContain('p50 must contain arrays of two numbers');
    });

    it('возвращает ошибку для невалидного backend в meta', () => {
      const invalidEntry = {
        id: 'test-id',
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 50000]],
        meta: {
          runtime_ms: 100,
          backend: 'invalid',
        },
      };

      const errors = validateHistoryEntry(invalidEntry);
      expect(errors).toContain(
        'meta.backend must be either "client" or "server"',
      );
    });

    it('возвращает ошибку для невалидного runtime_ms', () => {
      const invalidEntry = {
        id: 'test-id',
        created_at: '2024-01-15T10:30:00Z',
        symbol: 'BTCUSDT',
        tf: '1h',
        horizon: 24,
        provider: 'BINANCE',
        p50: [[1000, 50000]],
        meta: {
          runtime_ms: 'not-a-number',
          backend: 'client',
        },
      };

      const errors = validateHistoryEntry(invalidEntry);
      expect(errors).toContain('meta.runtime_ms must be a number');
    });
  });
});
