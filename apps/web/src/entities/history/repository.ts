import type { HistoryEntry } from './model';
import { localHistorySource } from './sources/local';
import { backendHistorySource } from './sources/backend';

export interface HistoryRepository {
  list(): Promise<HistoryEntry[]>;
  getById(id: string): Promise<HistoryEntry | null>;
  save(entry: HistoryEntry): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

const rawSource =
  process.env.NEXT_PUBLIC_HISTORY_SOURCE ||
  process.env.HISTORY_SOURCE ||
  'local';

const historySource = rawSource.toLowerCase();

const source =
  historySource === 'backend' ? backendHistorySource : localHistorySource;

export const historyRepository: HistoryRepository = source;
