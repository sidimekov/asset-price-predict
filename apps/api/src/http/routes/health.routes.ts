import type { FastifyInstance } from 'fastify';

import { isDbHealthy } from '../../db/index.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { status: 'ok', version: '0.1.0', db: isDbHealthy() };
  });
}
