import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountPage from '@/app/account/page';
import { accountService } from '@/features/account/model/accountService';
import { useProfile } from '@/features/account/model/useProfile';

// Простые моки без сложной логики
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  // Мокаем все зависимости простыми функциями
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: vi.fn(),
    }),
  }));

  vi.mock('@/features/account/model/useProfile', () => ({
    useProfile: () => ({
      profile: {
        username: 'testuser',
        login: 'test@example.com',
        avatarUrl: '',
      },
      setProfile: vi.fn(),
      loading: false,
    }),
  }));

  vi.mock('@/features/account/model/accountService', () => ({
    accountService: {
      changePassword: vi.fn(() => Promise.resolve()),
      updateAccount: vi.fn(() => Promise.resolve({ username: 'updateduser' })),
    },
  }));

  vi.mock('@/features/account/model/mapActionToMode', () => ({
    mapActionToMode: (label: string) => {
      const map: Record<string, string> = {
        'Edit photo': 'avatar',
        'Change password': 'password',
        'Change username': 'username',
        'Change login': 'login',
      };
      return map[label];
    },
  }));
});

// Мокаем компоненты
vi.mock('@/features/account/ProfileHeader', () => ({
  ProfileHeader: ({ profile, loading, onClick }: any) => (
    <div data-testid="profile-header" onClick={loading ? undefined : onClick}>
      ProfileHeader {loading ? 'loading' : 'loaded'}
      {profile?.username && <span>{profile.username}</span>}
    </div>
  ),
}));

vi.mock('@/features/account/ActionsList', () => ({
  ActionsList: ({ loading, onClick }: any) => (
    <div data-testid="actions-list">
      {loading ? (
        'loading'
      ) : (
        <>
          <button onClick={() => onClick?.('Edit photo')}>Edit photo</button>
          <button onClick={() => onClick?.('Change password')}>
            Change password
          </button>
          <button onClick={() => onClick?.('Change username')}>
            Change username
          </button>
          <button onClick={() => onClick?.('Change login')}>
            Change login
          </button>
          <button onClick={() => onClick?.('Log out')}>Log out</button>
        </>
      )}
    </div>
  ),
}));

vi.mock('@/features/account/EditAccountModal', () => ({
  EditAccountModal: ({ open, mode, onClose, onSave }: any) =>
    open ? (
      <div data-testid="edit-account-modal">
        <span>Mode: {mode}</span>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onSave({})}>Save</button>
      </div>
    ) : null,
}));

describe('AccountPage', () => {
  it('should render profile and actions list', () => {
    render(<AccountPage />);

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('actions-list')).toBeInTheDocument();
  });
});

// AccountPage дополнительные тесты
describe('AccountPage - дополнительные тесты', () => {
  it('should open modal for profile edit', () => {
    render(<AccountPage />);

    fireEvent.click(screen.getByTestId('profile-header'));

    expect(screen.getByTestId('edit-account-modal')).toBeInTheDocument();
    expect(screen.getByText('Mode: profile')).toBeInTheDocument();
  });

  it('should handle save error from accountService', async () => {
    vi.mocked(accountService.updateAccount).mockRejectedValue(
      new Error('Update failed'),
    );

    render(<AccountPage />);

    fireEvent.click(screen.getByText('Change username'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Mode: username')).toBeInTheDocument();
    });
  });
});
