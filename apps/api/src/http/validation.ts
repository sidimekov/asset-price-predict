import type { FastifyReply } from 'fastify';
import type { ZodError, ZodTypeAny } from 'zod';

import { formatZodErrors } from '@assetpredict/shared';
import { sendError } from './errors.js';

export function sendValidationError(reply: FastifyReply, err: ZodError) {
  return sendError(reply, 400, 'VALIDATION_ERROR', 'Validation failed', {
    details: formatZodErrors(err),
  });
}

export function parseOr400<S extends ZodTypeAny>(
  reply: FastifyReply,
  schema: S,
  value: unknown,
): { ok: true; data: import('zod').infer<S> } | { ok: false } {
  const res = schema.safeParse(value);
  if (!res.success) {
    sendValidationError(reply, res.error);
    return { ok: false };
  }
  return { ok: true, data: res.data };
}

export function parseOr500<S extends ZodTypeAny>(
  schema: S,
  value: unknown,
): { ok: true; data: import('zod').infer<S> } | { ok: false; error: ZodError } {
  const res = schema.safeParse(value);
  if (!res.success) return { ok: false, error: res.error };
  return { ok: true, data: res.data };
}
