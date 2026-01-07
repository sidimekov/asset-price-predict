import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

type ErrorResponse = {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
};

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

      const payload: ErrorResponse = {
        error: statusCode >= 500 ? 'Internal Server Error' : 'Bad Request',
        message:
          typeof err?.message === 'string' ? err.message : 'Unknown error',
        statusCode,
        requestId: req.id,
      };

      await reply.status(statusCode).send(payload);
    },
  );
}
