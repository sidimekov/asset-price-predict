import type { FastifyInstance } from 'fastify';
import { AccountController } from '../../modules/account/AccountController.js';

export async function accountRoutes(app: FastifyInstance) {
  const controller = new AccountController();

  app.get('/account', async () => {
    return controller.getAccount();
  });
}
