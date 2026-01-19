import type { HistoryEntry } from './model';
import { hybridHistorySource } from './sources/hybrid';
import { localHistorySource } from './sources/local';

export type HistoryPageRequest = {
  page: number;
  limit: number;
};

export type HistoryPage = HistoryPageRequest & {
  items: HistoryEntry[];
  total: number;
};

export interface HistoryRepository {
  list(): Promise<HistoryEntry[]>;
  listPage(req: HistoryPageRequest): Promise<HistoryPage>;
  getById(id: string): Promise<HistoryEntry | null>;
  save(entry: HistoryEntry): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

const rawSource =
  process.env.NEXT_PUBLIC_HISTORY_SOURCE ||
  process.env.HISTORY_SOURCE ||
  'hybrid';

const historySource = rawSource.toLowerCase();
const isLocalOnly = historySource === 'local';

const source = isLocalOnly ? localHistorySource : hybridHistorySource;

export const historyRepository: HistoryRepository = source;
