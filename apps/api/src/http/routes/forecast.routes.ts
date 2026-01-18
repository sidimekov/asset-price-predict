import type { FastifyInstance } from 'fastify';
import { zForecastCreateReq } from '@assetpredict/shared';

import { ForecastController } from '../../modules/forecast/ForecastController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { parseOr400 } from '../validation.js';
import { sendError } from '../errors';

export async function forecastRoutes(app: FastifyInstance) {
  const controller = new ForecastController();

  app.post('/forecast', { preHandler: requireAuth }, async (req, reply) => {
    const user = req.user;
    if (!user) {
      return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const parsed = parseOr400(reply, zForecastCreateReq, req.body);
    if (!parsed.ok) return;

    return controller.createForecast(parsed.data, user.id);
  });
}
