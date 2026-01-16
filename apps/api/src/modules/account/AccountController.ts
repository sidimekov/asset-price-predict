import type { AccountId, AccountRes } from '@assetpredict/shared';

export class AccountController {
  getAccount(): AccountRes {
    // мок профиль
    return {
      id: 'u1' as AccountId,
      username: 'Demo',
      email: 'demo@example.com',
    };
  }
}
