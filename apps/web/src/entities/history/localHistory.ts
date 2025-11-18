// apps/web/src/entities/history/localHistory.ts
import { LocalHistoryEntry, LocalHistoryList } from './model';

const STORAGE_KEY = 'localForecasts';

const isBrowser = typeof window !== 'undefined';

const getStorage = (): Storage | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isNumber = (v: unknown): v is number =>
  typeof v === 'number' && !Number.isNaN(v);
const isString = (v: unknown): v is string => typeof v === 'string';

const isPointTuple = (v: unknown): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && isNumber(v[0]) && isNumber(v[1]);

const isPointsArray = (v: unknown): v is Array<[number, number]> =>
  Array.isArray(v) && v.every(isPointTuple);

const isLocalHistoryEntry = (v: unknown): v is LocalHistoryEntry => {
  if (!v || typeof v !== 'object') return false;
  const obj = v as any;

  if (
    !isString(obj.id) ||
    !isString(obj.created_at) ||
    !isString(obj.symbol) ||
    !isString(obj.tf) ||
    !isNumber(obj.horizon) ||
    !isString(obj.provider) ||
    !isPointsArray(obj.p50) ||
    !Array.isArray(obj.explain) ||
    typeof obj.meta !== 'object' ||
    !obj.meta
  ) {
    return false;
  }

  if (!isNumber(obj.meta.runtime_ms) || !isString(obj.meta.backend)) {
    return false;
  }

  if (obj.p10 && !isPointsArray(obj.p10)) return false;
  if (obj.p90 && !isPointsArray(obj.p90)) return false;

  return true;
};

const safeParse = (raw: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('[LocalHistory] Failed to parse JSON, resetting.');
    return null;
  }
};

export const LocalHistory = {
  /**
   * Возвращает массив локальных прогнозов.
   * При ошибке/пустоте — безопасно возвращает [].
   */
  load(): LocalHistoryList {
    const storage = getStorage();
    if (!storage) return [];

    const raw = storage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const validItems = parsed.filter(isLocalHistoryEntry);
    return validItems;
  },

  /**
   * Добавляет запись в историю, возвращает актуальный массив.
   */
  save(entry: LocalHistoryEntry): LocalHistoryList {
    const storage = getStorage();
    if (!storage) {
      // В SSR просто ничего не делаем, но возвращаем "как будто" история с этим элементом
      return [entry];
    }

    const current = this.load();
    const next = [...current, entry];

    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },

  /**
   * Возвращает запись по id или null.
   */
  getById(id: string): LocalHistoryEntry | null {
    const items = this.load();
    return items.find((x) => x.id === id) ?? null;
  },

  /**
   * Полная очистка истории.
   */
  clear(): void {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(STORAGE_KEY);
  },
};
