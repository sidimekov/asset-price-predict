import type { HistoryEntry } from '../model';
import type { HistoryRepository } from '../repository';

const STORAGE_KEY = 'localForecasts';

function hasLocalStorage(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function isTuple(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

export function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as HistoryEntry;

  if (
    typeof entry.id !== 'string' ||
    typeof entry.created_at !== 'string' ||
    typeof entry.symbol !== 'string' ||
    typeof entry.tf !== 'string' ||
    typeof entry.horizon !== 'number' ||
    typeof entry.provider !== 'string'
  ) {
    return false;
  }

  if (!Array.isArray(entry.p50) || !entry.p50.every(isTuple)) {
    return false;
  }

  if (entry.p10 && (!Array.isArray(entry.p10) || !entry.p10.every(isTuple))) {
    return false;
  }

  if (entry.p90 && (!Array.isArray(entry.p90) || !entry.p90.every(isTuple))) {
    return false;
  }

  if (!entry.meta || typeof entry.meta !== 'object') return false;
  if (
    typeof entry.meta.runtime_ms !== 'number' ||
    (entry.meta.backend !== 'client' && entry.meta.backend !== 'server')
  ) {
    return false;
  }

  return true;
}

function readEntries(): HistoryEntry[] {
  if (!hasLocalStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry);
  } catch {
    return [];
  }
}

function writeEntries(entries: HistoryEntry[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // noop - localStorage can be unavailable or full
  }
}

function sortByCreatedAt(entries: HistoryEntry[]): HistoryEntry[] {
  return entries
    .slice()
    .sort(
      (a, b) =>
        (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0),
    );
}

export const localHistorySource: HistoryRepository = {
  async list() {
    return sortByCreatedAt(readEntries());
  },

  async getById(id: string) {
    const items = readEntries();
    return items.find((entry) => entry.id === id) ?? null;
  },

  async save(entry: HistoryEntry) {
    const items = readEntries();
    const index = items.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      items[index] = entry;
    } else {
      items.push(entry);
    }
    writeEntries(items);
  },

  async remove(id: string) {
    const items = readEntries().filter((entry) => entry.id !== id);
    writeEntries(items);
  },

  async clear() {
    if (!hasLocalStorage()) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  },
};
