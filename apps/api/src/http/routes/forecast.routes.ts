import type { FastifyInstance } from 'fastify';
import type { ForecastCreateReq } from '@assetpredict/shared';
import { ForecastController } from '../../modules/forecast/ForecastController.js';

export async function forecastRoutes(app: FastifyInstance) {
  const controller = new ForecastController();

  app.post('/forecast', async (req) => {
    const body = (req.body ?? {}) as Partial<ForecastCreateReq>;
    return controller.createForecast(body);
  });
}
