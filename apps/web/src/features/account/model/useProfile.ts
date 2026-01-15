'use client';

import { useEffect, useState } from 'react';
import type { Profile } from './types';
import { accountService } from './accountService';

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        accountService
            .getProfile()
            .then(setProfile)
            .catch(() => setError('Failed to load profile'))
            .finally(() => setLoading(false));
    }, []);

    return {
        profile,
        setProfile,
        loading,
        error,
    };
}
