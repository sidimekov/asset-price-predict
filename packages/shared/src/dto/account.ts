import type { BrandedId } from '../types/common.js';

export type AccountId = BrandedId<'user'> & string;

export interface AccountProfile {
  id: AccountId;
  username: string;
  login: string;
  email?: string;
}

export type AccountRes = AccountProfile;
