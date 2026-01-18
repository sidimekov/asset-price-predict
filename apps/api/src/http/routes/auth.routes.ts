import type { FastifyInstance } from 'fastify';
import { zLoginReq, zRegisterReq } from '@assetpredict/shared';

import { AuthController } from '../../modules/auth/AuthController.js';
import { AuthError } from '../../modules/auth/AuthService.js';
import { sendError } from '../errors.js';
import { parseOr400 } from '../validation.js';

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  app.post('/register', async (req, reply) => {
    const parsed = parseOr400(reply, zRegisterReq, req.body);
    if (!parsed.ok) return;

    try {
      return await controller.register(parsed.data);
    } catch (err) {
      if (err instanceof AuthError) {
        return sendError(reply, err.statusCode, 'AUTH_ERROR', err.message);
      }
      throw err;
    }
  });

  app.post('/login', async (req, reply) => {
    const parsed = parseOr400(reply, zLoginReq, req.body);
    if (!parsed.ok) return;

    try {
      return await controller.login(parsed.data);
    } catch (err) {
      if (err instanceof AuthError) {
        return sendError(reply, err.statusCode, 'AUTH_ERROR', err.message);
      }
      throw err;
    }
  });

  app.post('/logout', async () => {
    return { ok: true };
  });
}
