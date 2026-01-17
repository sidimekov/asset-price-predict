import type { BrandedId } from '../types/common.js';

export type AccountId = BrandedId<'user'> & string;

export interface AccountProfile {
  id: AccountId;
  username: string;
  email: string;
  avatarUrl?: string;
}

export type AccountRes = AccountProfile;

export interface UpdateAccountReq {
  email?: string;
  username?: string;
  avatarUrl?: string;
  password?: string;
  currentPassword?: string;
}
