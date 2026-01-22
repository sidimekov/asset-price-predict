'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileHeader } from '@/features/account/ProfileHeader';
import { ActionsList } from '@/features/account/ActionsList';
import { EditAccountModal } from '@/features/account/EditAccountModal';
import type { AccountEditMode } from '@/features/account/model/accountTypes';
import {
  useGetMeQuery,
  useUpdateMeMutation,
  accountApi,
} from '@/shared/api/account.api';
import { useLogoutMutation } from '@/shared/api/auth.api';
import { useAppDispatch } from '@/shared/store/hooks';
import type { UpdateAccountReq } from '@assetpredict/shared';
import { backendApi } from '@/shared/api/backendApi';

const EMPTY_PROFILE = {
  username: '',
  email: '',
  avatarUrl: undefined as string | undefined,
};

const AccountPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { data: profile, isLoading } = useGetMeQuery();
  const [updateMe] = useUpdateMeMutation();
  const [logout] = useLogoutMutation();

  const [editMode, setEditMode] = useState<AccountEditMode | null>(null);

  const safeProfile = profile ?? EMPTY_PROFILE;

  const handleSave = async (patch: UpdateAccountReq) => {
    if (!profile) {
      console.warn('Account not loaded — update skipped');
      return;
    }

    // optimistic update
    dispatch(
      accountApi.util.updateQueryData('getMe', undefined, (draft) => {
        if (!draft) return;
        Object.assign(draft, patch);
      }),
    );

    try {
      await updateMe(patch).unwrap();
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const handleLogout = async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth.token');
    }
    dispatch(backendApi.util.resetApiState());
    router.replace('/auth');
    try {
      await logout().unwrap();
    } catch {
      // noop
    }
  };

  const openEditMode = (mode: AccountEditMode) => setEditMode(mode);
  const closeEditMode = () => setEditMode(null);

  return (
    <main className="account-content">
      <div className="max-w-md mx-auto space-y-6">
        {/* ProfileHeader всегда виден */}
        <ProfileHeader
          loading={isLoading}
          profile={safeProfile}
          onClick={() => openEditMode('profile')} // можно сделать редактирование профиля по клику
        />

        {/* Если editMode не выбран — показываем ActionsList */}
        {!editMode && (
          <ActionsList
            loading={isLoading}
            onAction={openEditMode}
            onLogout={handleLogout}
          />
        )}

        {/* Если editMode выбран — показываем форму редактирования */}
        {editMode && (
          <EditAccountModal
            mode={editMode}
            profile={safeProfile}
            onCancel={closeEditMode}
            onSave={handleSave}
          />
        )}
      </div>
    </main>
  );
};

export default AccountPage;
