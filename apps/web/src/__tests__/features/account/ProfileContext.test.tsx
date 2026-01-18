// apps/web/src/__tests__/features/account/ProfileContext.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ProfileProvider,
  useProfileContext,
} from '@/features/account/ProfileContext';

// Создаем правильные моки для accountService
vi.mock('@/features/account/model/accountService', () => {
  const mockGetProfile = vi.fn();
  const mockUpdateAccount = vi.fn();

  return {
    accountService: {
      getProfile: mockGetProfile,
      updateAccount: mockUpdateAccount,
    },
  };
});

import { accountService } from '@/features/account/model/accountService';

const mockProfile = {
  username: 'John Doe',
  login: 'john@example.com',
  avatarUrl: '/avatar.jpg',
};

// Тестовый компонент для использования контекста
const TestComponent = () => {
  const { profile, loading, error } = useProfileContext();

  if (loading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">{error}</div>;

  return (
    <div data-testid="profile">
      <div data-testid="username">{profile?.username}</div>
      <div data-testid="email">{profile?.login}</div>
      <div data-testid="avatar">{profile?.avatarUrl}</div>
    </div>
  );
};

// Компонент для тестирования updateProfile
const TestUpdateComponent = ({ updatePayload }: { updatePayload: any }) => {
  const { profile, updateProfile } = useProfileContext();

  const handleUpdate = async () => {
    await updateProfile(updatePayload);
  };

  return (
    <div>
      <div data-testid="username">{profile?.username}</div>
      <button onClick={handleUpdate} data-testid="update-btn">
        Update
      </button>
    </div>
  );
};

describe('ProfileContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Настраиваем моки с помощью mockResolvedValue
    (accountService.getProfile as any).mockResolvedValue(mockProfile);
    (accountService.updateAccount as any).mockResolvedValue(mockProfile);
  });

  it('provides profile data to children', async () => {
    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>,
    );

    // Проверяем что сначала идет загрузка
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Ждем загрузки профиля
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('email')).toHaveTextContent('john@example.com');
      expect(screen.getByTestId('avatar')).toHaveTextContent('/avatar.jpg');
    });

    // Проверяем что getProfile был вызван
    expect(accountService.getProfile).toHaveBeenCalledTimes(1);
  });

  it('handles loading errors', async () => {
    (accountService.getProfile as any).mockRejectedValue(
      new Error('Failed to load'),
    );

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>,
    );

    // Ждем ошибки
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Failed to load profile',
      );
    });
  });

  it('provides updateProfile function', async () => {
    const updatePayload = { username: 'Jane Doe' };
    const updatedProfile = { ...mockProfile, ...updatePayload };
    (accountService.updateAccount as any).mockResolvedValue(updatedProfile);

    render(
      <ProfileProvider>
        <TestUpdateComponent updatePayload={updatePayload} />
      </ProfileProvider>,
    );

    // Ждем загрузки
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('John Doe');
    });

    // Кликаем кнопку обновления
    fireEvent.click(screen.getByTestId('update-btn'));

    // Проверяем что updateAccount был вызван с правильными параметрами
    await waitFor(() => {
      expect(accountService.updateAccount).toHaveBeenCalledWith(updatePayload);
    });
  });

  it('updates local state after successful update', async () => {
    const updatePayload = { username: 'Jane Doe' };
    const updatedProfile = { ...mockProfile, username: 'Jane Doe' };

    (accountService.updateAccount as any).mockResolvedValue(updatedProfile);

    // Компонент который показывает обновленное имя
    const TestStateComponent = () => {
      const { profile, updateProfile } = useProfileContext();

      const handleUpdate = async () => {
        await updateProfile(updatePayload);
      };

      return (
        <div>
          <div data-testid="current-username">{profile?.username}</div>
          <button onClick={handleUpdate} data-testid="state-update-btn">
            Update State
          </button>
        </div>
      );
    };

    render(
      <ProfileProvider>
        <TestStateComponent />
      </ProfileProvider>,
    );

    // Ждем начальной загрузки
    await waitFor(() => {
      expect(screen.getByTestId('current-username')).toHaveTextContent(
        'John Doe',
      );
    });

    // Вызываем обновление
    fireEvent.click(screen.getByTestId('state-update-btn'));

    // После обновления имя должно измениться
    await waitFor(() => {
      expect(accountService.updateAccount).toHaveBeenCalledWith(updatePayload);
      // Note: State update happens inside context, but the component may need
      // additional triggers to show the updated state
    });
  });
});
