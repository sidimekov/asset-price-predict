import type { AccountId, AccountRes } from '@assetpredict/shared';

import { findUserById } from '../../repositories/user.repo.js';

export class AccountController {
  async getAccount(userId: string): Promise<AccountRes | null> {
    const user = await findUserById(userId);
    if (!user) return null;

    if (!user.email) return null;

    return {
      id: user.id as AccountId,
      username: user.username,
      email: user.email,
    };
  }
}
