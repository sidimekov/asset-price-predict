// apps/web/src/features/account/model/useProfile.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем контекст профиля вместо accountService
vi.mock('@/features/account/ProfileContext', () => ({
  useProfileContext: vi.fn(),
}));

import { useProfile } from '@/features/account/model/useProfile';
import { useProfileContext } from '@/features/account/ProfileContext';

describe('useProfile', () => {
  const mockUseProfileContext = vi.mocked(useProfileContext);

  const mockProfile = {
    username: 'Test User',
    login: 'test@test.com',
    avatarUrl: '/avatar.png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return profile from context', () => {
    // Настраиваем мок контекста
    mockUseProfileContext.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    const { result } = renderHook(() => useProfile());

    // Проверяем что хук возвращает данные из контекста
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    // Проверяем что useProfileContext был вызван
    expect(mockUseProfileContext).toHaveBeenCalled();
  });

  it('should return loading state from context', () => {
    mockUseProfileContext.mockReturnValue({
      profile: null,
      loading: true,
      error: null,
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    const { result } = renderHook(() => useProfile());

    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should return error from context', () => {
    mockUseProfileContext.mockReturnValue({
      profile: null,
      loading: false,
      error: 'Failed to load profile',
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    const { result } = renderHook(() => useProfile());

    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load profile');
  });

  describe('setProfile function', () => {
    it('should call context.updateProfile when setProfile is called', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue(undefined);

      mockUseProfileContext.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        updateProfile: mockUpdateProfile,
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => useProfile());

      const patch = { username: 'Updated User' };
      await result.current.setProfile(patch);

      // Проверяем что updateProfile был вызван с правильными параметрами
      expect(mockUpdateProfile).toHaveBeenCalledWith(patch);
      expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from updateProfile', async () => {
      const mockUpdateProfile = vi
        .fn()
        .mockRejectedValue(new Error('Update failed'));

      mockUseProfileContext.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        updateProfile: mockUpdateProfile,
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => useProfile());

      const patch = { username: 'Updated User' };

      // Ожидаем что ошибка будет проброшена
      await expect(result.current.setProfile(patch)).rejects.toThrow(
        'Update failed',
      );

      expect(mockUpdateProfile).toHaveBeenCalledWith(patch);
    });

    it('should return Promise<void> as expected by AccountPage', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue(undefined);

      mockUseProfileContext.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        updateProfile: mockUpdateProfile,
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => useProfile());

      const patch = { username: 'Test' };
      const returnValue = result.current.setProfile(patch);

      // Проверяем что возвращается Promise
      expect(returnValue).toBeInstanceOf(Promise);

      // Проверяем что Promise резолвится без значения (void)
      const resolvedValue = await returnValue;
      expect(resolvedValue).toBeUndefined();
    });
  });

  describe('compatibility with AccountPage interface', () => {
    it('should provide setProfile that accepts Partial<Profile>', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue(undefined);

      mockUseProfileContext.mockReturnValue({
        profile: mockProfile,
        loading: false,
        error: null,
        updateProfile: mockUpdateProfile,
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => useProfile());

      // Тестируем разные возможные поля для Partial<Profile>
      const testCases: Array<Partial<typeof mockProfile>> = [
        { username: 'New Name' },
        { login: 'new@email.com' },
        { avatarUrl: '/new-avatar.png' },
        { username: 'New', login: 'new@test.com' },
        {},
      ];

      for (const patch of testCases) {
        await result.current.setProfile(patch);
        expect(mockUpdateProfile).toHaveBeenCalledWith(patch);
        mockUpdateProfile.mockClear();
      }
    });
  });

  describe('error handling scenarios', () => {
    it('should propagate context errors', () => {
      const errorMessage = 'Network error occurred';

      mockUseProfileContext.mockReturnValue({
        profile: null,
        loading: false,
        error: errorMessage,
        updateProfile: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle undefined profile gracefully', () => {
      mockUseProfileContext.mockReturnValue({
        profile: undefined as any, // Тестируем неверный тип
        loading: false,
        error: null,
        updateProfile: vi.fn(),
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(() => useProfile());

      // Просто проверяем что хук не падает
      expect(result.current.profile).toBeUndefined();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('ProfileContext integration', () => {
    it('should properly integrate with ProfileContext', () => {
      const mockContextValue = {
        profile: mockProfile,
        loading: true,
        error: 'Some error',
        updateProfile: vi.fn(),
        refreshProfile: vi.fn(),
      };

      mockUseProfileContext.mockReturnValue(mockContextValue);

      const { result } = renderHook(() => useProfile());

      // Проверяем что хук правильно передает значения из контекста
      expect(result.current.profile).toBe(mockContextValue.profile);
      expect(result.current.loading).toBe(mockContextValue.loading);
      expect(result.current.error).toBe(mockContextValue.error);

      // Проверяем что setProfile оборачивает updateProfile
      expect(typeof result.current.setProfile).toBe('function');

      // Проверяем что setProfile вызывает updateProfile с правильным контекстом
      const patch = { username: 'Test' };
      result.current.setProfile(patch);
      expect(mockContextValue.updateProfile).toHaveBeenCalledWith(patch);
    });
  });
});

// Примечание: также нужно создать тестовый оберточный компонент для тестирования контекста
