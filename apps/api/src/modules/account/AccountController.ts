import type {
  AccountId,
  AccountRes,
  UpdateAccountReq,
} from '@assetpredict/shared';

import {
  findUserByEmail,
  findUserById,
  updateUserPassword,
  updateUserProfile,
} from '../../repositories/user.repo.js';
import { hashPassword, verifyPassword } from '../auth/password.js';

export class AccountError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class AccountController {
  async getAccount(userId: string): Promise<AccountRes | null> {
    const user = await findUserById(userId);
    if (!user) return null;

    if (!user.email) return null;

    return {
      id: user.id as AccountId,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url ?? undefined,
    };
  }

  async updateAccount(
    userId: string,
    input: UpdateAccountReq,
  ): Promise<AccountRes> {
    const user = await findUserById(userId);
    if (!user || !user.email) {
      throw new AccountError(404, 'Account not found');
    }

    if (input.email) {
      const existing = await findUserByEmail(input.email);
      if (existing && existing.id !== user.id) {
        throw new AccountError(409, 'Email already in use');
      }
    }

    if (input.password) {
      if (!input.currentPassword) {
        throw new AccountError(400, 'Current password is required');
      }
      const matches = verifyPassword(input.currentPassword, user.password_hash);
      if (!matches) {
        throw new AccountError(401, 'Invalid credentials');
      }
    }

    const profileUpdated = await updateUserProfile({
      id: userId,
      email: input.email,
      username: input.username,
      avatarUrl: input.avatarUrl,
    });

    if (input.password) {
      const passwordHash = hashPassword(input.password);
      await updateUserPassword({ id: userId, passwordHash });
    }

    const updated = profileUpdated ?? (await findUserById(userId));
    if (!updated || !updated.email) {
      throw new AccountError(500, 'Failed to update account');
    }

    return {
      id: updated.id as AccountId,
      username: updated.username,
      email: updated.email,
      avatarUrl: updated.avatar_url ?? undefined,
    };
  }
}
