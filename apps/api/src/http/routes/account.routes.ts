import type { FastifyInstance } from 'fastify';
import { zUpdateAccountReq } from '@assetpredict/shared';
import type { MultipartFile } from '@fastify/multipart';
import { mkdir, writeFile } from 'node:fs/promises';

import {
  AccountController,
  AccountError,
} from '../../modules/account/AccountController.js';
import { updateUserProfile } from '../../repositories/user.repo.js';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE,
  avatarsDir,
  buildAvatarPath,
  buildAvatarUrl,
} from '../../config/uploads.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { parseOr400 } from '../validation.js';
import { sendError } from '../errors';

export async function accountRoutes(app: FastifyInstance) {
  const controller = new AccountController();

  app.get('/account', { preHandler: requireAuth }, async (req, reply) => {
    const user = req.user;
    if (!user) {
      return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const profile = await controller.getAccount(user.id);
    if (!profile) {
      return sendError(reply, 404, 'ACCOUNT_NOT_FOUND', 'Account not found');
    }

    return profile;
  });

  app.patch('/account', { preHandler: requireAuth }, async (req, reply) => {
    const user = req.user;
    if (!user) {
      return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const parsed = parseOr400(reply, zUpdateAccountReq, req.body);
    if (!parsed.ok) return;

    try {
      return await controller.updateAccount(user.id, parsed.data);
    } catch (err) {
      if (err instanceof AccountError) {
        return sendError(reply, err.statusCode, 'ACCOUNT_ERROR', err.message);
      }
      throw err;
    }
  });

  app.post(
    '/account/avatar',
    { preHandler: requireAuth },
    async (req, reply) => {
      const user = req.user;
      if (!user) {
        return sendError(reply, 401, 'UNAUTHORIZED', 'Unauthorized');
      }

      if (!req.isMultipart()) {
        return sendError(
          reply,
          400,
          'INVALID_REQUEST',
          'Expected multipart/form-data',
        );
      }

      let file: MultipartFile | undefined;
      try {
        file = await req.file();
      } catch (err) {
        if ((err as { code?: string })?.code === 'FST_REQ_FILE_TOO_LARGE') {
          return sendError(
            reply,
            400,
            'FILE_TOO_LARGE',
            'Avatar exceeds maximum size',
            { maxBytes: MAX_AVATAR_SIZE },
          );
        }
        throw err;
      }

      if (!file) {
        return sendError(reply, 400, 'MISSING_FILE', 'Avatar file is required');
      }

      if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
        return sendError(
          reply,
          400,
          'INVALID_FILE',
          'Invalid avatar file type',
          {
            allowed: ALLOWED_AVATAR_MIME_TYPES,
            received: file.mimetype,
          },
        );
      }

      let buffer: Buffer;
      try {
        buffer = await file.toBuffer();
      } catch (err) {
        if ((err as { code?: string })?.code === 'FST_REQ_FILE_TOO_LARGE') {
          return sendError(
            reply,
            400,
            'FILE_TOO_LARGE',
            'Avatar exceeds maximum size',
            { maxBytes: MAX_AVATAR_SIZE },
          );
        }
        throw err;
      }

      if (buffer.length > MAX_AVATAR_SIZE) {
        return sendError(
          reply,
          400,
          'FILE_TOO_LARGE',
          'Avatar exceeds maximum size',
          { maxBytes: MAX_AVATAR_SIZE },
        );
      }

      await mkdir(avatarsDir, { recursive: true });
      await writeFile(buildAvatarPath(user.id), buffer);

      const avatarUrl = buildAvatarUrl(user.id);
      const updated = await updateUserProfile({ id: user.id, avatarUrl });
      if (!updated) {
        return sendError(reply, 404, 'ACCOUNT_NOT_FOUND', 'Account not found');
      }

      return { avatarUrl };
    },
  );
}
