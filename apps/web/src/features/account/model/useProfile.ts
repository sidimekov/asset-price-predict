// apps/web/src/features/account/model/useProfile.ts
'use client';

import { useProfileContext } from '../ProfileContext';
import { Profile } from '@/features/account/model/types';

export function useProfile() {
  const context = useProfileContext();
  return {
    profile: context.profile,
    // Изменяем setProfile чтобы он принимал Partial<Profile> и возвращал Promise<void>
    setProfile: async (patch: Partial<Profile>) => {
      await context.updateProfile(patch);
      // Не возвращаем значение, чтобы соответствовать интерфейсу из AccountPage
    },
    loading: context.loading,
    error: context.error,
  };
}
