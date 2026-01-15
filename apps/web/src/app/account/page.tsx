'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ProfileHeader } from '@/features/account/ProfileHeader';
import { ActionsList } from '@/features/account/ActionsList';
import { EditAccountModal } from '@/features/account/EditAccountModal';

import { useProfile } from '@/features/account/model/useProfile';
import { accountService } from '@/features/account/model/accountService';
import type { EditAccountMode } from '@/features/account/model/editAccountModes';
import { mapActionToMode } from '@/features/account/model/mapActionToMode';

const AccountPage: React.FC = () => {
  const router = useRouter();

  const { profile, setProfile, loading } = useProfile();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<EditAccountMode>('profile');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <main className="account-content">
        <div className="max-w-md mx-auto space-y-8">
          <ProfileHeader loading />
        </div>
      </main>
    );
  }

  const openModal = (nextMode: EditAccountMode) => {
    if (loading) return;
    setError(null);
    setMode(nextMode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false); // После Cancel показываем ActionsList
  };

  const handleProfileClick = () => {
    openModal('profile');
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
        const updated = await accountService.updateAccount(payload);
        setProfile(updated);
      }

      setIsModalOpen(false); // После Save показываем ActionsList
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
          profile={profile}
          loading={loading}
          onClick={handleProfileClick}
        />

        {/* Скрываем список кнопок, если открыта модалка */}
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
