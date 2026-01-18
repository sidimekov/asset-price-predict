import type { HistoryRepository } from '../repository';

export const backendHistorySource: HistoryRepository = {
  async list() {
    return [];
  },

  async getById() {
    return null;
  },

  async save() {
    throw new Error('Not implemented');
  },

  async remove() {
    throw new Error('Not implemented');
  },

  async clear() {
    throw new Error('Not implemented');
  },
};
