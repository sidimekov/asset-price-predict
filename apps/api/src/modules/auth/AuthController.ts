import type { LoginRes, UserId } from '@assetpredict/shared';

const mockAuthResponse = (): LoginRes => ({
  token: 'mock',
  user: {
    id: 'u1' as UserId,
    email: 'user@example.com',
    username: 'Demo',
  },
});

export class AuthController {
  login(): LoginRes {
    // мок JWT + мок пользователь
    return mockAuthResponse();
  }

  logout(): LoginRes {
    return mockAuthResponse();
  }
}
