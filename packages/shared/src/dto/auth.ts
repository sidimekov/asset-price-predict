import type { BrandedId } from '../types/common.js';

export type UserId = BrandedId<'user'> & string;

export interface AuthUser {
  id: UserId;
  email: string;
  username: string;
  avatarUrl?: string;
}

export interface LoginReq {
  email: string;
  password: string;
}

export interface LoginRes {
  token: string;
  user: AuthUser;
}

export interface RegisterReq {
  email: string;
  password: string;
  username?: string;
}

export type RegisterRes = LoginRes;
