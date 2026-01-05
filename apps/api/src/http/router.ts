import type { FastifyInstance } from 'fastify';

import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { accountRoutes } from './routes/account.routes.js';
import { forecastRoutes } from './routes/forecast.routes.js';
import { historyRoutes } from './routes/history.routes.js';

export function registerRouter(app: FastifyInstance) {
  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/auth' });
  app.register(accountRoutes);
  app.register(forecastRoutes);
  app.register(historyRoutes);
}
