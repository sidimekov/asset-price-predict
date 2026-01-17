import type { FastifyReply, FastifyRequest } from 'fastify';

import { verifyAuthToken } from '../../modules/auth/jwt.js';
import { sendError } from '../errors.js';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
  }

  try {
    req.user = await verifyAuthToken(token);
  } catch {
    return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
  }
}
