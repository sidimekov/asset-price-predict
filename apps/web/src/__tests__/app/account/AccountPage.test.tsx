// AccountPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('AccountPage', () => {
  beforeEach(() => {
    vi.resetModules(); // Сбрасываем модули перед каждым тестом
    vi.clearAllMocks();

    // Мокаем localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: vi.fn(),
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('should render ProfileHeader and ActionsList when not loading', async () => {
    // Используем vi.doMock вместо vi.mock - он не hoisted
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: vi.fn(),
      }),
    }));

    vi.doMock('@/shared/api/account.api', () => ({
      useGetMeQuery: () => ({
        data: {
          username: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        isLoading: false,
      }),
      useUpdateMeMutation: () => [vi.fn(), { isLoading: false }],
      accountApi: {
        util: {
          updateQueryData: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/api/auth.api', () => ({
      useLogoutMutation: () => [vi.fn(), { isLoading: false }],
    }));

    vi.doMock('@/shared/api/backendApi', () => ({
      backendApi: {
        util: {
          resetApiState: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/store/hooks', () => ({
      useAppDispatch: () => vi.fn(),
    }));

    vi.doMock('@/features/account/ProfileHeader', () => ({
      ProfileHeader: ({ loading, profile, onClick }: any) => (
        <div data-testid="profile-header" onClick={onClick}>
          {loading ? 'Loading...' : profile.username || 'No username'}
        </div>
      ),
    }));

    vi.doMock('@/features/account/ActionsList', () => ({
      ActionsList: ({ loading, onAction, onLogout }: any) => (
        <div data-testid="actions-list">
          <button onClick={() => onAction('profile')}>Edit Profile</button>
          <button onClick={onLogout}>Logout</button>
        </div>
      ),
    }));

    vi.doMock('@/features/account/EditAccountModal', () => ({
      EditAccountModal: ({ mode, profile, onCancel, onSave }: any) => (
        <div data-testid="edit-modal">
          <div>Editing: {mode}</div>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => onSave({ username: 'Updated User' })}>
            Save
          </button>
        </div>
      ),
    }));

    // Импортируем компонент после настройки моков
    const { default: AccountPage } = await import('@/app/account/page');
    render(<AccountPage />);

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('profile-header')).toHaveTextContent('Test User');
    expect(screen.getByTestId('actions-list')).toBeInTheDocument();
  });

  it('should show loading state', async () => {
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: vi.fn(),
      }),
    }));

    vi.doMock('@/shared/api/account.api', () => ({
      useGetMeQuery: () => ({
        data: null,
        isLoading: true,
      }),
      useUpdateMeMutation: () => [vi.fn(), { isLoading: false }],
      accountApi: {
        util: {
          updateQueryData: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/api/auth.api', () => ({
      useLogoutMutation: () => [vi.fn(), { isLoading: false }],
    }));

    vi.doMock('@/shared/api/backendApi', () => ({
      backendApi: {
        util: {
          resetApiState: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/store/hooks', () => ({
      useAppDispatch: () => vi.fn(),
    }));

    vi.doMock('@/features/account/ProfileHeader', () => ({
      ProfileHeader: ({ loading, profile, onClick }: any) => (
        <div data-testid="profile-header" onClick={onClick}>
          {loading ? 'Loading...' : profile.username || 'No username'}
        </div>
      ),
    }));

    vi.doMock('@/features/account/ActionsList', () => ({
      ActionsList: () => <div data-testid="actions-list">Actions</div>,
    }));

    vi.doMock('@/features/account/EditAccountModal', () => ({
      EditAccountModal: () => <div data-testid="edit-modal">Edit</div>,
    }));

    const { default: AccountPage } = await import('@/app/account/page');
    render(<AccountPage />);

    expect(screen.getByTestId('profile-header')).toHaveTextContent(
      'Loading...',
    );
  });

  it('should handle empty profile data', async () => {
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: vi.fn(),
      }),
    }));

    vi.doMock('@/shared/api/account.api', () => ({
      useGetMeQuery: () => ({
        data: null,
        isLoading: false,
      }),
      useUpdateMeMutation: () => [vi.fn(), { isLoading: false }],
      accountApi: {
        util: {
          updateQueryData: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/api/auth.api', () => ({
      useLogoutMutation: () => [vi.fn(), { isLoading: false }],
    }));

    vi.doMock('@/shared/api/backendApi', () => ({
      backendApi: {
        util: {
          resetApiState: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/store/hooks', () => ({
      useAppDispatch: () => vi.fn(),
    }));

    vi.doMock('@/features/account/ProfileHeader', () => ({
      ProfileHeader: ({ loading, profile, onClick }: any) => (
        <div data-testid="profile-header" onClick={onClick}>
          {loading ? 'Loading...' : profile.username || 'No username'}
        </div>
      ),
    }));

    vi.doMock('@/features/account/ActionsList', () => ({
      ActionsList: () => <div data-testid="actions-list">Actions</div>,
    }));

    vi.doMock('@/features/account/EditAccountModal', () => ({
      EditAccountModal: () => <div data-testid="edit-modal">Edit</div>,
    }));

    const { default: AccountPage } = await import('@/app/account/page');
    render(<AccountPage />);

    expect(screen.getByTestId('profile-header')).toHaveTextContent(
      'No username',
    );
  });

  it('should open edit modal when edit button is clicked', async () => {
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: vi.fn(),
      }),
    }));

    vi.doMock('@/shared/api/account.api', () => ({
      useGetMeQuery: () => ({
        data: { username: 'User', email: 'test@test.com' },
        isLoading: false,
      }),
      useUpdateMeMutation: () => [vi.fn(), { isLoading: false }],
      accountApi: {
        util: {
          updateQueryData: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/api/auth.api', () => ({
      useLogoutMutation: () => [vi.fn(), { isLoading: false }],
    }));

    vi.doMock('@/shared/api/backendApi', () => ({
      backendApi: {
        util: {
          resetApiState: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/store/hooks', () => ({
      useAppDispatch: () => vi.fn(),
    }));

    vi.doMock('@/features/account/ProfileHeader', () => ({
      ProfileHeader: () => <div data-testid="profile-header">Profile</div>,
    }));

    vi.doMock('@/features/account/ActionsList', () => ({
      ActionsList: ({ onAction }: any) => (
        <div data-testid="actions-list">
          <button onClick={() => onAction('profile')}>Edit Profile</button>
        </div>
      ),
    }));

    vi.doMock('@/features/account/EditAccountModal', () => ({
      EditAccountModal: ({ mode, onCancel }: any) => (
        <div data-testid="edit-modal">
          <span>Mode: {mode}</span>
          <button onClick={onCancel}>Cancel</button>
        </div>
      ),
    }));

    const { default: AccountPage } = await import('@/app/account/page');
    render(<AccountPage />);

    const editButton = screen.getByText('Edit Profile');
    await userEvent.click(editButton);

    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    expect(screen.getByText('Mode: profile')).toBeInTheDocument();
  });

  it('should close edit modal when cancel is clicked', async () => {
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: vi.fn(),
      }),
    }));

    vi.doMock('@/shared/api/account.api', () => ({
      useGetMeQuery: () => ({
        data: { username: 'User', email: 'test@test.com' },
        isLoading: false,
      }),
      useUpdateMeMutation: () => [vi.fn(), { isLoading: false }],
      accountApi: {
        util: {
          updateQueryData: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/api/auth.api', () => ({
      useLogoutMutation: () => [vi.fn(), { isLoading: false }],
    }));

    vi.doMock('@/shared/api/backendApi', () => ({
      backendApi: {
        util: {
          resetApiState: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/store/hooks', () => ({
      useAppDispatch: () => vi.fn(),
    }));

    vi.doMock('@/features/account/ProfileHeader', () => ({
      ProfileHeader: () => <div data-testid="profile-header">Profile</div>,
    }));

    vi.doMock('@/features/account/ActionsList', () => ({
      ActionsList: ({ onAction }: any) => (
        <div data-testid="actions-list">
          <button onClick={() => onAction('profile')}>Edit Profile</button>
        </div>
      ),
    }));

    vi.doMock('@/features/account/EditAccountModal', () => ({
      EditAccountModal: ({ onCancel }: any) => (
        <div data-testid="edit-modal">
          <button onClick={onCancel}>Cancel</button>
        </div>
      ),
    }));

    const { default: AccountPage } = await import('@/app/account/page');
    render(<AccountPage />);

    // Открываем модалку
    const editButton = screen.getByText('Edit Profile');
    await userEvent.click(editButton);

    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();

    // Закрываем модалку
    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('actions-list')).toBeInTheDocument();
  });

  it('should handle logout button click', async () => {
    const mockRouterReplace = vi.fn();
    const mockLogoutMutation = vi.fn().mockResolvedValue({});
    const mockResetApiState = vi.fn();

    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: mockRouterReplace,
      }),
    }));

    vi.doMock('@/shared/api/account.api', () => ({
      useGetMeQuery: () => ({
        data: { username: 'User', email: 'test@test.com' },
        isLoading: false,
      }),
      useUpdateMeMutation: () => [vi.fn(), { isLoading: false }],
      accountApi: {
        util: {
          updateQueryData: vi.fn(),
        },
      },
    }));

    vi.doMock('@/shared/api/auth.api', () => ({
      useLogoutMutation: () => [mockLogoutMutation, { isLoading: false }],
    }));

    vi.doMock('@/shared/api/backendApi', () => ({
      backendApi: {
        util: {
          resetApiState: mockResetApiState,
        },
      },
    }));

    vi.doMock('@/shared/store/hooks', () => ({
      useAppDispatch: () => vi.fn(),
    }));

    vi.doMock('@/features/account/ProfileHeader', () => ({
      ProfileHeader: () => <div data-testid="profile-header">Profile</div>,
    }));

    vi.doMock('@/features/account/ActionsList', () => ({
      ActionsList: ({ onLogout }: any) => (
        <div data-testid="actions-list">
          <button onClick={onLogout}>Logout</button>
        </div>
      ),
    }));

    vi.doMock('@/features/account/EditAccountModal', () => ({
      EditAccountModal: () => <div data-testid="edit-modal">Edit</div>,
    }));

    const { default: AccountPage } = await import('@/app/account/page');
    render(<AccountPage />);

    const logoutButton = screen.getByText('Logout');
    await userEvent.click(logoutButton);

    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth.token');
      expect(mockResetApiState).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith('/auth');
      expect(mockLogoutMutation).toHaveBeenCalled();
    });
  });
});
