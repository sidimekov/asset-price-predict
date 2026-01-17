import type { FastifyReply } from 'fastify';

export type ApiErrorPayload = {
  code: string;
  message: string;
  detail?: unknown;
};

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  detail?: unknown,
) {
  const payload: ApiErrorPayload = {
    code,
    message,
    ...(detail === undefined ? {} : { detail }),
  };

  return reply.status(statusCode).send(payload);
}
