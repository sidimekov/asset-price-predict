import type { FastifyReply, FastifyRequest } from 'fastify';

import { verifyAuthToken } from '../../modules/auth/jwt.js';

export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    req.user = await verifyAuthToken(token);
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}
