// apps/web/src/features/account/context/ProfileContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Profile } from '@/features/account/model/types';
import { accountService } from '@/features/account/model/accountService';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (patch: Partial<Profile>) => Promise<Profile>; // <-- меняем на Promise<Profile>
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      const data = await accountService.getProfile();
      setProfile(data);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadProfile();
  }, []);

  const updateProfile = async (patch: Partial<Profile>) => {
    try {
      const updated = await accountService.updateAccount(patch);
      setProfile(updated);
      return updated; // <-- возвращаем обновленный профиль
    } catch (err) {
      setError('Failed to update profile');
      throw err;
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};
