import type { FastifyInstance } from 'fastify';
import { AuthController } from '../../modules/auth/AuthController.js';

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  app.post('/login', async () => controller.login());
  app.post('/logout', async () => controller.logout());
}
