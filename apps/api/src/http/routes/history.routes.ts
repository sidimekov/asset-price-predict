import type { FastifyInstance } from 'fastify';
import { HistoryController } from '../../modules/history/HistoryController.js';

export async function historyRoutes(app: FastifyInstance) {
  const controller = new HistoryController();

  app.get('/forecasts', async (req) => {
    const q = (req.query ?? {}) as Record<string, unknown>;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);

    return controller.listForecasts({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 20
    });
  });

  app.get('/forecasts/:id', async (req) => {
    const params = (req.params ?? {}) as { id?: string };
    return controller.getForecastDetail(params.id ?? 'mock-forecast-id');
  });
}
