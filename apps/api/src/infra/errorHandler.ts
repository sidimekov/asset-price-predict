import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { sendError } from '../http/errors.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler(
    async (err: any, req: FastifyRequest, reply: FastifyReply) => {
      const statusCode =
        typeof err?.statusCode === 'number' &&
        err.statusCode >= 400 &&
        err.statusCode < 600
          ? err.statusCode
          : 500;

      // Лог ошибок только 5xx, 4xx — warn
      if (statusCode >= 500) {
        req.log.error({ err }, 'Unhandled error');
      } else {
        req.log.warn({ err }, 'Request error');
      }

      const code = statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST';
      const message =
        typeof err?.message === 'string' ? err.message : 'Unknown error';

      await sendError(reply, statusCode, code, message, {
        requestId: req.id,
      });
    },
  );
}
