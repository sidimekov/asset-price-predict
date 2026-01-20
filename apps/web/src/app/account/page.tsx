// apps/web/src/app/account/page.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileHeader } from '@/features/account/ProfileHeader';
import { ActionsList } from '@/features/account/ActionsList';
import { useGetMeQuery } from '@/shared/api/account.api';
import { useLogoutMutation } from '@/shared/api/auth.api';
import { useAppDispatch } from '@/shared/store/hooks';
import { backendApi } from '@/shared/api/backendApi';

const AccountPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token =
    typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem('auth.token');
  const {
    data: profile,
    isFetching,
    isLoading,
  } = useGetMeQuery(undefined, {
    skip: !token,
  });
  const [logout] = useLogoutMutation();
  const loading = isLoading || isFetching;

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

  const handleActionClick = (label: string) => {
    if (label === 'Log out') {
      localStorage.setItem('ap.auth.mock', 'false');
      router.push('/auth');
      return;
    }

    const mapped = mapActionToMode(label);
    if (mapped) {
      openModal(mapped);
    }
  };

  const handleSave = async (payload: any) => {
    setSaving(true);
    setError(null);

    try {
      if (mode === 'password') {
        await accountService.changePassword(payload);
      } else {
        // Используем функцию updateProfile из контекста
        await updateProfile(payload);
        // После успешного обновления контекст обновит профиль везде
      }

      setIsModalOpen(false);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="account-content">
      <div className="max-w-md mx-auto space-y-8">
        <ProfileHeader
          loading={loading}
          onClick={handleProfileClick}
          profile={profile}
        />
        <ActionsList
          loading={loading}
          onClick={(label) => console.log(label)}
          onLogout={handleLogout}
        />

        {!isModalOpen && (
          <ActionsList loading={loading} onClick={handleActionClick} />
        )}
      </div>

      <EditAccountModal
        open={isModalOpen}
        mode={mode}
        profile={profile}
        loading={saving}
        error={error}
        onClose={closeModal}
        onSave={handleSave}
      />
    </main>
  );
};

export default AccountPage;
