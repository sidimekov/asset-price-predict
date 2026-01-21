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

  const handleProfileClick = () => alert('Go to Account Settings');

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
      </div>
    </main>
  );
};

export default AccountPage;
