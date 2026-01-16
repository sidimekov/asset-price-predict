// useProfile.test.tsx - с таймаутом
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/features/account/model/accountService', () => ({
  accountService: {
    getProfile: vi.fn(),
    updateAccount: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import { useProfile } from '@/features/account/model/useProfile';
import { accountService } from '@/features/account/model/accountService';

describe('useProfile', () => {
  const mockProfile = {
    username: 'Test User',
    login: 'test@test.com',
    avatarUrl: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // НЕ используем fake timers если они вызывают проблемы
  });

  it('should fetch profile on mount', async () => {
    // Мок без задержки
    (accountService.getProfile as any).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useProfile());

    // Ждем без таймеров
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.profile).toEqual(mockProfile);
  }, 10000); // Увеличиваем таймаут теста

  it('should handle fetch error', async () => {
    (accountService.getProfile as any).mockRejectedValue(
      new Error('Fetch failed'),
    );

    const { result } = renderHook(() => useProfile());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe('Failed to load profile');
  }, 10000);
});
