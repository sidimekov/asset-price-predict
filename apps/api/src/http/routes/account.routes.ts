import type { FastifyInstance } from 'fastify';
import { AccountController } from '../../modules/account/AccountController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export async function accountRoutes(app: FastifyInstance) {
  const controller = new AccountController();

  app.get('/account', { preHandler: requireAuth }, async (req, reply) => {
    const user = req.user;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const profile = await controller.getAccount(user.id);
    if (!profile) {
      return reply.status(404).send({ error: 'Account not found' });
    }

    return profile;
  });
}
