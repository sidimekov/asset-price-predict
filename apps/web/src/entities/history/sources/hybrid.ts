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
      const [backendItems, localItems] = await Promise.all([
        backendHistorySource.list(),
        localHistorySource.list(),
      ]);
      const combined = new Map<string, HistoryEntry>();
      for (const item of backendItems) {
        combined.set(item.id, item);
      }
      for (const item of localItems) {
        combined.set(item.id, item);
      }
      const merged = Array.from(combined.values()).sort((a, b) => {
        const aDate = Date.parse(a.created_at) || 0;
        const bDate = Date.parse(b.created_at) || 0;
        return bDate - aDate;
      });
      const page = Math.max(1, req.page ?? 1);
      const limit = Math.max(1, req.limit ?? 20);
      const start = (page - 1) * limit;
      return {
        items: merged.slice(start, start + limit),
        total: merged.length,
        page,
        limit,
      };
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
