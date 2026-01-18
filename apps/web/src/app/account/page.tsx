// apps/web/src/app/account/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ProfileHeader } from '@/features/account/ProfileHeader';
import { ActionsList } from '@/features/account/ActionsList';
import { EditAccountModal } from '@/features/account/EditAccountModal';

import { useProfileContext } from '@/features/account/ProfileContext'; // <-- меняем импорт
import { accountService } from '@/features/account/model/accountService';
import type { EditAccountMode } from '@/features/account/model/editAccountModes';
import { mapActionToMode } from '@/features/account/model/mapActionToMode';

const AccountPage: React.FC = () => {
  const router = useRouter();
  const { profile, loading, updateProfile } = useProfileContext(); // <-- используем контекст

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
    setIsModalOpen(false);
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
          profile={profile}
          loading={loading}
          onClick={handleProfileClick}
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
