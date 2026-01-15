import type { AccountRes } from '@assetpredict/shared';

export class AccountController {
  getAccount(): AccountRes {
    // мок профиль
    return {
      id: 'u1',
      username: 'Demo',
      login: 'demo',
      email: 'demo@example.com',
    };
  }
}
