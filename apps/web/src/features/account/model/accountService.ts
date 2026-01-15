import type { Profile } from './types';
import { PROFILE_STORAGE_KEY } from './constants';
import profileMock from '@/mocks/profile.json';

const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const accountService = {
    async getProfile(): Promise<Profile> {
        await delay(150);

        if (typeof window === 'undefined') {
            return profileMock as Profile;
        }

        const stored = localStorage.getItem(PROFILE_STORAGE_KEY);

        if (stored) {
            try {
                return JSON.parse(stored) as Profile;
            } catch {
                localStorage.removeItem(PROFILE_STORAGE_KEY);
            }
        }

        return profileMock as Profile;
    },

    async updateAccount(patch: Partial<Profile>): Promise<Profile> {
        await delay(200);

        const current = await this.getProfile();

        const updated: Profile = {
            ...current,
            ...patch,
        };

        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));

        return updated;
    },

    async changePassword(_: {
        currentPassword: string;
        newPassword: string;
    }): Promise<void> {
        await delay(200);
        // ничего не делаем — заглушка под backend
    },
};
