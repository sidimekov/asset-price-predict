import { describe, it, expect, vi } from 'vitest';
import { backendHistorySource } from '@/entities/history/sources/backend';
import type { HistoryEntry } from '@/entities/history/model';

describe('backendHistorySource', () => {
  describe('list', () => {
    it('возвращает пустой массив', async () => {
      const result = await backendHistorySource.list();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('возвращает null для любого id', async () => {
      const result = await backendHistorySource.getById('test-id');
      expect(result).toBeNull();
    });

    it('возвращает null для пустого id', async () => {
      const result = await backendHistorySource.getById('');
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('всегда выбрасывает ошибку "Not implemented"', async () => {
      const mockEntry: HistoryEntry = {
        id: 'test-id',
        created_at: new Date().toISOString(),
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

      await expect(backendHistorySource.save(mockEntry)).rejects.toThrow(
        'Not implemented',
      );
    });
  });

  describe('remove', () => {
    it('всегда выбрасывает ошибку "Not implemented"', async () => {
      await expect(backendHistorySource.remove('test-id')).rejects.toThrow(
        'Not implemented',
      );
    });
  });

  describe('clear', () => {
    it('всегда выбрасывает ошибку "Not implemented"', async () => {
      await expect(backendHistorySource.clear()).rejects.toThrow(
        'Not implemented',
      );
    });
  });

  describe('типизация', () => {
    it('соответствует интерфейсу HistoryRepository', () => {
      expect(typeof backendHistorySource.list).toBe('function');
      expect(typeof backendHistorySource.getById).toBe('function');
      expect(typeof backendHistorySource.save).toBe('function');
      expect(typeof backendHistorySource.remove).toBe('function');
      expect(typeof backendHistorySource.clear).toBe('function');
    });

    it('методы возвращают промисы', async () => {
      const listResult = backendHistorySource.list();
      expect(listResult).toBeInstanceOf(Promise);

      const getByIdResult = backendHistorySource.getById('id');
      expect(getByIdResult).toBeInstanceOf(Promise);

      const savePromise = backendHistorySource
        .save({} as HistoryEntry)
        .catch(() => {});
      expect(savePromise).toBeInstanceOf(Promise);

      const removePromise = backendHistorySource.remove('id').catch(() => {});
      expect(removePromise).toBeInstanceOf(Promise);

      const clearPromise = backendHistorySource.clear().catch(() => {});
      expect(clearPromise).toBeInstanceOf(Promise);
    });
  });
});
