import type { BrandedId } from '../types/common.js';

export type UserId = BrandedId<'user'> & string;

export interface AuthUser {
  id: UserId;
  email?: string;
  username?: string;
  login?: string;
}

export interface LoginReq {
  email: string;
  password: string;
}

export interface LoginRes {
  token: string;
  user: AuthUser;
}
