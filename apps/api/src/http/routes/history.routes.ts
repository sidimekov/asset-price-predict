import type { FastifyInstance } from 'fastify';
import { zForecastDetailRes } from '@assetpredict/shared';

import { HistoryController } from '../../modules/history/HistoryController.js';
import { parseOr500 } from '../validation.js';

export async function historyRoutes(app: FastifyInstance) {
  const controller = new HistoryController();

  app.get('/forecasts', async (req) => {
    const q = (req.query ?? {}) as Record<string, unknown>;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);

    return controller.listForecasts({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
    });
  });

  app.get('/forecasts/:id', async (req, reply) => {
    const params = (req.params ?? {}) as { id?: string };
    const dto = controller.getForecastDetail(params.id ?? 'mock-forecast-id');

    // Валидация ответа перед отправкой :contentReference[oaicite:4]{index=4}
    const parsed = parseOr500(zForecastDetailRes, dto);
    if (!parsed.ok) {
      req.log.error(
        { err: parsed.error },
        'Invalid ForecastDetailRes produced by API',
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }

    return parsed.data;
  });
}
