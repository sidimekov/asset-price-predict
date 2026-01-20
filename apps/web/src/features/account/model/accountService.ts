import type { AccountRes, UpdateAccountReq } from '@assetpredict/shared';
import { useUpdateMeMutation } from '@/shared/api/account.api';

export const updateAccountLocal = async (
  current: AccountRes,
  patch: UpdateAccountReq,
): Promise<AccountRes> => {
  await new Promise((r) => setTimeout(r, 200));
  return { ...current, ...patch };
};
