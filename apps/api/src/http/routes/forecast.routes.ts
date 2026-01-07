import type { FastifyInstance } from 'fastify';
import { zForecastCreateReq } from '@assetpredict/shared';

import { ForecastController } from '../../modules/forecast/ForecastController.js';
import { parseOr400 } from '../validation.js';

export async function forecastRoutes(app: FastifyInstance) {
  const controller = new ForecastController();

  app.post('/forecast', async (req, reply) => {
    const parsed = parseOr400(reply, zForecastCreateReq, req.body);
    if (!parsed.ok) return;

    return controller.createForecast(parsed.data);
  });
}
