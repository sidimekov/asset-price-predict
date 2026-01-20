import type { HistoryEntry } from '../model';
import type {
  HistoryPage,
  HistoryPageRequest,
  HistoryRepository,
} from '../repository';
import { backendHistorySource } from './backend';
import { localHistorySource } from './local';

const fallbackWarning = (action: string, error: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[History] backend ${action} failed, falling back to local`,
      error,
    );
  }
};

export const hybridHistorySource: HistoryRepository = {
  async list() {
    const { items } = await hybridHistorySource.listPage({
      page: 1,
      limit: 10_000,
    });
    return items;
  },

  async listPage(req: HistoryPageRequest) {
    try {
      return await backendHistorySource.listPage(req);
    } catch (err) {
      fallbackWarning('listPage', err);
      return localHistorySource.listPage(req);
    }
  },

  async getById(id: string) {
    try {
      return await backendHistorySource.getById(id);
    } catch (err) {
      fallbackWarning('getById', err);
      return localHistorySource.getById(id);
    }
  },

  async save(entry: HistoryEntry) {
    return localHistorySource.save(entry);
  },

  async remove(id: string) {
    return localHistorySource.remove(id);
  },

  async clear() {
    return localHistorySource.clear();
  },
};
