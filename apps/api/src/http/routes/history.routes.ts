import type { FastifyInstance } from 'fastify';
import { zForecastDetailRes } from '@assetpredict/shared';

import { HistoryController } from '../../modules/history/HistoryController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { parseOr500 } from '../validation.js';
import { sendError } from '../errors.js';

export async function historyRoutes(app: FastifyInstance) {
  const controller = new HistoryController();

  app.get('/forecasts', { preHandler: requireAuth }, async (req, reply) => {
    const user = req.user;
    if (!user) {
      return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const q = (req.query ?? {}) as Record<string, unknown>;
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);

    return controller.listForecasts(
      {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
      },
      user.id,
    );
  });

  app.get('/forecasts/:id', { preHandler: requireAuth }, async (req, reply) => {
    const user = req.user;
    if (!user) {
      return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const params = (req.params ?? {}) as { id?: string };
    const dto = await controller.getForecastDetail(
      params.id ?? 'mock-forecast-id',
      user.id,
    );

    if (!dto) {
      return sendError(reply, 404, 'FORECAST_NOT_FOUND', 'Forecast not found');
    }

    // Валидация ответа перед отправкой :contentReference[oaicite:4]{index=4}
    const parsed = parseOr500(zForecastDetailRes, dto);
    if (!parsed.ok) {
      req.log.error(
        { err: parsed.error },
        'Invalid ForecastDetailRes produced by API',
      );
      return sendError(
        reply,
        500,
        'INTERNAL_SERVER_ERROR',
        'Internal server error',
      );
    }

    return parsed.data;
  });
}
