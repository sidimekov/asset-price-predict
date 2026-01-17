import type { FastifyInstance } from 'fastify';
import { zUpdateAccountReq } from '@assetpredict/shared';

import {
  AccountController,
  AccountError,
} from '../../modules/account/AccountController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { parseOr400 } from '../validation.js';

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

  app.patch('/account', { preHandler: requireAuth }, async (req, reply) => {
    const user = req.user;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const parsed = parseOr400(reply, zUpdateAccountReq, req.body);
    if (!parsed.ok) return;

    try {
      return await controller.updateAccount(user.id, parsed.data);
    } catch (err) {
      if (err instanceof AccountError) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
}
