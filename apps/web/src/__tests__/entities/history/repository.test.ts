// apps/web/src/__tests__/entities/history/repository.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HistoryEntry } from '@/entities/history/model';

// Сохраняем оригинальные переменные окружения
const originalEnv = process.env;

// Mock модулей с использованием factory функций
vi.mock('@/entities/history/sources/local', () => {
  // Определяем функцию внутри factory
  const createMockSource = () => ({
    list: vi.fn<() => Promise<HistoryEntry[]>>(() => Promise.resolve([])),
    getById: vi.fn<(id: string) => Promise<HistoryEntry | null>>(() =>
      Promise.resolve(null),
    ),
    save: vi.fn<(entry: HistoryEntry) => Promise<void>>(() =>
      Promise.resolve(),
    ),
    remove: vi.fn<(id: string) => Promise<void>>(() => Promise.resolve()),
    clear: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  });

  return {
    localHistorySource: createMockSource(),
  };
});

vi.mock('@/entities/history/sources/backend', () => {
  // Определяем функцию внутри factory
  const createMockSource = () => ({
    list: vi.fn<() => Promise<HistoryEntry[]>>(() => Promise.resolve([])),
    getById: vi.fn<(id: string) => Promise<HistoryEntry | null>>(() =>
      Promise.resolve(null),
    ),
    save: vi.fn<(entry: HistoryEntry) => Promise<void>>(() =>
      Promise.resolve(),
    ),
    remove: vi.fn<(id: string) => Promise<void>>(() => Promise.resolve()),
    clear: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  });

  return {
    backendHistorySource: createMockSource(),
  };
});

// Теперь импортируем основной модуль (после моков)
import { historyRepository } from '@/entities/history/repository';

// Для получения доступа к mock объектам используем vi.mocked
import { localHistorySource } from '@/entities/history/sources/local';
import { backendHistorySource } from '@/entities/history/sources/backend';

const mockLocalHistorySource = vi.mocked(localHistorySource);
const mockBackendHistorySource = vi.mocked(backendHistorySource);

// Создаем вспомогательную функцию для использования в тестах с vi.doMock
const createMockSource = () => ({
  list: vi.fn<() => Promise<HistoryEntry[]>>(() => Promise.resolve([])),
  getById: vi.fn<(id: string) => Promise<HistoryEntry | null>>(() =>
    Promise.resolve(null),
  ),
  save: vi.fn<(entry: HistoryEntry) => Promise<void>>(() => Promise.resolve()),
  remove: vi.fn<(id: string) => Promise<void>>(() => Promise.resolve()),
  clear: vi.fn<() => Promise<void>>(() => Promise.resolve()),
});

describe('historyRepository', () => {
  beforeEach(() => {
    // Очищаем все моки
    vi.clearAllMocks();

    // Сбрасываем переменные окружения к оригинальным
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Восстанавливаем оригинальные переменные окружения
    process.env = originalEnv;
  });

  describe('интерфейс HistoryRepository', () => {
    const mockEntry: HistoryEntry = {
      id: 'test-id-123',
      created_at: '2024-01-15T10:30:00Z',
      symbol: 'BTCUSDT',
      tf: '1h',
      horizon: 24,
      provider: 'BINANCE',
      p50: [
        [1700000000000, 50000],
        [1700003600000, 51000],
      ],
      meta: {
        runtime_ms: 100,
        backend: 'client',
      },
    };

    beforeEach(() => {
      // Очищаем моки перед каждым тестом
      vi.clearAllMocks();
    });

    describe('list()', () => {
      it('делегирует вызов активному источнику', async () => {
        const mockEntries: HistoryEntry[] = [mockEntry];
        mockLocalHistorySource.list.mockResolvedValue(mockEntries);

        const result = await historyRepository.list();

        expect(mockLocalHistorySource.list).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockEntries);
      });

      it('возвращает пустой массив если источник вернул пустой массив', async () => {
        const emptyArray: HistoryEntry[] = [];
        mockLocalHistorySource.list.mockResolvedValue(emptyArray);

        const result = await historyRepository.list();

        expect(result).toEqual([]);
      });

      it('пробрасывает ошибку от источника', async () => {
        const error = new Error('List failed');
        mockLocalHistorySource.list.mockRejectedValue(error);

        await expect(historyRepository.list()).rejects.toThrow('List failed');
      });
    });

    describe('getById()', () => {
      it('делегирует вызов активному источнику', async () => {
        mockLocalHistorySource.getById.mockResolvedValue(mockEntry);

        const result = await historyRepository.getById('test-id-123');

        expect(mockLocalHistorySource.getById).toHaveBeenCalledWith(
          'test-id-123',
        );
        expect(result).toEqual(mockEntry);
      });

      it('возвращает null если источник вернул null', async () => {
        mockLocalHistorySource.getById.mockResolvedValue(null);

        const result = await historyRepository.getById('non-existent-id');

        expect(result).toBeNull();
      });

      it('обрабатывает пустой ID', async () => {
        mockLocalHistorySource.getById.mockResolvedValue(null);

        const result = await historyRepository.getById('');

        expect(mockLocalHistorySource.getById).toHaveBeenCalledWith('');
        expect(result).toBeNull();
      });

      it('пробрасывает ошибку от источника', async () => {
        const error = new Error('GetById failed');
        mockLocalHistorySource.getById.mockRejectedValue(error);

        await expect(historyRepository.getById('test-id')).rejects.toThrow(
          'GetById failed',
        );
      });
    });

    describe('save()', () => {
      it('делегирует вызов активному источнику', async () => {
        mockLocalHistorySource.save.mockResolvedValue(undefined);

        await historyRepository.save(mockEntry);

        expect(mockLocalHistorySource.save).toHaveBeenCalledWith(mockEntry);
      });

      it('пробрасывает ошибку от источника', async () => {
        const error = new Error('Save failed');
        mockLocalHistorySource.save.mockRejectedValue(error);

        await expect(historyRepository.save(mockEntry)).rejects.toThrow(
          'Save failed',
        );
      });

      it('обрабатывает минимальные обязательные поля HistoryEntry', async () => {
        const minimalEntry: HistoryEntry = {
          id: 'minimal-id',
          created_at: '2024-01-15T10:30:00Z',
          symbol: 'ETHUSDT',
          tf: '1d',
          horizon: 7,
          provider: 'MOCK',
          p50: [[1700000000000, 2000]],
          meta: {
            runtime_ms: 50,
            backend: 'server',
          },
        };

        mockLocalHistorySource.save.mockResolvedValue(undefined);

        await historyRepository.save(minimalEntry);

        expect(mockLocalHistorySource.save).toHaveBeenCalledWith(minimalEntry);
      });
    });

    describe('remove()', () => {
      it('делегирует вызов активному источнику', async () => {
        mockLocalHistorySource.remove.mockResolvedValue(undefined);

        await historyRepository.remove('test-id-123');

        expect(mockLocalHistorySource.remove).toHaveBeenCalledWith(
          'test-id-123',
        );
      });

      it('пробрасывает ошибку от источника', async () => {
        const error = new Error('Remove failed');
        mockLocalHistorySource.remove.mockRejectedValue(error);

        await expect(historyRepository.remove('test-id')).rejects.toThrow(
          'Remove failed',
        );
      });

      it('обрабатывает удаление несуществующей записи (без ошибки)', async () => {
        mockLocalHistorySource.remove.mockResolvedValue(undefined);

        await expect(
          historyRepository.remove('non-existent-id'),
        ).resolves.not.toThrow();
      });
    });

    describe('clear()', () => {
      it('делегирует вызов активному источнику', async () => {
        mockLocalHistorySource.clear.mockResolvedValue(undefined);

        await historyRepository.clear();

        expect(mockLocalHistorySource.clear).toHaveBeenCalledTimes(1);
      });

      it('пробрасывает ошибку от источника', async () => {
        const error = new Error('Clear failed');
        mockLocalHistorySource.clear.mockRejectedValue(error);

        await expect(historyRepository.clear()).rejects.toThrow('Clear failed');
      });
    });
  });

  // Тесты для проверки branch coverage
  describe('branch coverage тесты', () => {
    const mockEntry: HistoryEntry = {
      id: 'test-id',
      created_at: '2024-01-15T10:30:00Z',
      symbol: 'BTCUSDT',
      tf: '1h',
      horizon: 24,
      provider: 'BINANCE',
      p50: [[1700000000000, 50000]],
      meta: {
        runtime_ms: 100,
        backend: 'client',
      },
    };

    // Вспомогательная функция для тестирования с разными env
    const testRepositoryWithEnv = async (
      envVars: Record<string, string | undefined>,
    ) => {
      // Сохраняем оригинальные env
      const originalEnv = { ...process.env };

      // Устанавливаем тестовые env
      Object.entries(envVars).forEach(([key, value]) => {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      });

      // Создаем новые mock объекты с функцией внутри блока
      const localMock = (() => ({
        list: vi.fn<() => Promise<HistoryEntry[]>>(() => Promise.resolve([])),
        getById: vi.fn<(id: string) => Promise<HistoryEntry | null>>(() =>
          Promise.resolve(null),
        ),
        save: vi.fn<(entry: HistoryEntry) => Promise<void>>(() =>
          Promise.resolve(),
        ),
        remove: vi.fn<(id: string) => Promise<void>>(() => Promise.resolve()),
        clear: vi.fn<() => Promise<void>>(() => Promise.resolve()),
      }))();

      const backendMock = (() => ({
        list: vi.fn<() => Promise<HistoryEntry[]>>(() => Promise.resolve([])),
        getById: vi.fn<(id: string) => Promise<HistoryEntry | null>>(() =>
          Promise.resolve(null),
        ),
        save: vi.fn<(entry: HistoryEntry) => Promise<void>>(() =>
          Promise.resolve(),
        ),
        remove: vi.fn<(id: string) => Promise<void>>(() => Promise.resolve()),
        clear: vi.fn<() => Promise<void>>(() => Promise.resolve()),
      }))();

      // Используем vi.doMock для динамического мока
      vi.doMock('@/entities/history/sources/local', () => ({
        localHistorySource: localMock,
      }));

      vi.doMock('@/entities/history/sources/backend', () => ({
        backendHistorySource: backendMock,
      }));

      // Перезагружаем модуль
      vi.resetModules();
      const { historyRepository: freshRepo } = await import(
        '@/entities/history/repository'
      );

      // Возвращаем репозиторий и mock объекты
      return {
        repository: freshRepo,
        localMock,
        backendMock,
        restoreEnv: () => {
          process.env = originalEnv;
        },
      };
    };

    afterEach(() => {
      vi.resetModules();
    });

    it('использует local источник по умолчанию (нет env переменных)', async () => {
      const { repository, localMock, backendMock, restoreEnv } =
        await testRepositoryWithEnv({
          NEXT_PUBLIC_HISTORY_SOURCE: undefined,
          HISTORY_SOURCE: undefined,
        });

      try {
        localMock.list.mockResolvedValue([mockEntry]);
        const result = await repository.list();

        expect(localMock.list).toHaveBeenCalledTimes(1);
        expect(backendMock.list).not.toHaveBeenCalled();
        expect(result).toEqual([mockEntry]);
      } finally {
        restoreEnv();
      }
    });

    it('использует backend источник при NEXT_PUBLIC_HISTORY_SOURCE=backend', async () => {
      const { repository, localMock, backendMock, restoreEnv } =
        await testRepositoryWithEnv({
          NEXT_PUBLIC_HISTORY_SOURCE: 'backend',
          HISTORY_SOURCE: undefined,
        });

      try {
        backendMock.list.mockResolvedValue([mockEntry]);
        const result = await repository.list();

        expect(backendMock.list).toHaveBeenCalledTimes(1);
        expect(localMock.list).not.toHaveBeenCalled();
        expect(result).toEqual([mockEntry]);
      } finally {
        restoreEnv();
      }
    });

    it('использует local источник при NEXT_PUBLIC_HISTORY_SOURCE=local', async () => {
      const { repository, localMock, backendMock, restoreEnv } =
        await testRepositoryWithEnv({
          NEXT_PUBLIC_HISTORY_SOURCE: 'local',
          HISTORY_SOURCE: undefined,
        });

      try {
        localMock.list.mockResolvedValue([mockEntry]);
        const result = await repository.list();

        expect(localMock.list).toHaveBeenCalledTimes(1);
        expect(backendMock.list).not.toHaveBeenCalled();
        expect(result).toEqual([mockEntry]);
      } finally {
        restoreEnv();
      }
    });

    it('использует local источник при NEXT_PUBLIC_HISTORY_SOURCE=unknown', async () => {
      const { repository, localMock, backendMock, restoreEnv } =
        await testRepositoryWithEnv({
          NEXT_PUBLIC_HISTORY_SOURCE: 'unknown',
          HISTORY_SOURCE: undefined,
        });

      try {
        localMock.list.mockResolvedValue([mockEntry]);
        const result = await repository.list();

        expect(localMock.list).toHaveBeenCalledTimes(1);
        expect(backendMock.list).not.toHaveBeenCalled();
        expect(result).toEqual([mockEntry]);
      } finally {
        restoreEnv();
      }
    });

    it('приводит значение к нижнему регистру (BACKEND)', async () => {
      const { repository, localMock, backendMock, restoreEnv } =
        await testRepositoryWithEnv({
          NEXT_PUBLIC_HISTORY_SOURCE: 'BACKEND',
          HISTORY_SOURCE: undefined,
        });

      try {
        backendMock.list.mockResolvedValue([mockEntry]);
        const result = await repository.list();

        expect(backendMock.list).toHaveBeenCalledTimes(1);
        expect(localMock.list).not.toHaveBeenCalled();
        expect(result).toEqual([mockEntry]);
      } finally {
        restoreEnv();
      }
    });

    it('использует HISTORY_SOURCE если NEXT_PUBLIC_HISTORY_SOURCE не установлен', async () => {
      const { repository, localMock, backendMock, restoreEnv } =
        await testRepositoryWithEnv({
          NEXT_PUBLIC_HISTORY_SOURCE: undefined,
          HISTORY_SOURCE: 'backend',
        });

      try {
        backendMock.list.mockResolvedValue([mockEntry]);
        const result = await repository.list();

        expect(backendMock.list).toHaveBeenCalledTimes(1);
        expect(localMock.list).not.toHaveBeenCalled();
        expect(result).toEqual([mockEntry]);
      } finally {
        restoreEnv();
      }
    });

    it('отдает приоритет NEXT_PUBLIC_HISTORY_SOURCE над HISTORY_SOURCE', async () => {
      const { repository, localMock, backendMock, restoreEnv } =
        await testRepositoryWithEnv({
          NEXT_PUBLIC_HISTORY_SOURCE: 'backend',
          HISTORY_SOURCE: 'local',
        });

      try {
        backendMock.list.mockResolvedValue([mockEntry]);
        const result = await repository.list();

        expect(backendMock.list).toHaveBeenCalledTimes(1);
        expect(localMock.list).not.toHaveBeenCalled();
        expect(result).toEqual([mockEntry]);
      } finally {
        restoreEnv();
      }
    });

    it('использует local источник при пустой строке', async () => {
      const { repository, localMock, backendMock, restoreEnv } =
        await testRepositoryWithEnv({
          NEXT_PUBLIC_HISTORY_SOURCE: '',
          HISTORY_SOURCE: undefined,
        });

      try {
        localMock.list.mockResolvedValue([mockEntry]);
        const result = await repository.list();

        expect(localMock.list).toHaveBeenCalledTimes(1);
        expect(backendMock.list).not.toHaveBeenCalled();
        expect(result).toEqual([mockEntry]);
      } finally {
        restoreEnv();
      }
    });
  });
});
