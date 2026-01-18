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
import { Profile } from '@/features/account/model/types';

interface Props {
  profile?: Profile | null;
  setProfile?: (p: Profile) => void;
}

const AccountPage: React.FC<Props> = ({
  profile: rootProfile,
  setProfile: setRootProfile,
}) => {
  const router = useRouter();

  // Используем профиль из пропсов, если есть, иначе хук
  const {
    profile: localProfile,
    setProfile: setLocalProfile,
    loading,
  } = useProfile();
  const profile = rootProfile ?? localProfile;
  const setProfile = setRootProfile ?? setLocalProfile;

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
        const updated = await accountService.updateAccount(payload);
        setProfile(updated); // <-- обновляем профиль через пропс или локально
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
