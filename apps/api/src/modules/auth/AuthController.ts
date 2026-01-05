export class AuthController {
  login() {
    // мок JWT + мок пользователь
    return {
      token: 'mock',
      user: { id: 'u1', email: 'user@example.com' }
    };
  }

  logout() {
    return {
      token: 'mock',
      user: { id: 'u1', email: 'user@example.com' }
    };
  }
}
