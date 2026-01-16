import type { LoginReq, LoginRes, RegisterReq } from '@assetpredict/shared';

import { AuthService } from './AuthService.js';

export class AuthController {
  private service: AuthService;

  constructor(service: AuthService = new AuthService()) {
    this.service = service;
  }

  async register(input: RegisterReq): Promise<LoginRes> {
    return this.service.register(input);
  }

  async login(input: LoginReq): Promise<LoginRes> {
    return this.service.login(input);
  }
}
