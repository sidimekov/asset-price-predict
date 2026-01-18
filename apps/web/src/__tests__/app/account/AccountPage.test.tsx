import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountPage from '@/app/account/page';

// Самые простые моки без внешних переменных
vi.mock('@/features/account/ProfileContext', () => ({
  useProfileContext: () => ({
    profile: {
      username: 'testuser',
      login: 'test@example.com',
      avatarUrl: '',
    },
    loading: false,
    updateProfile: vi.fn(() => Promise.resolve()),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/features/account/model/accountService', () => ({
  accountService: {
    changePassword: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/features/account/model/mapActionToMode', () => ({
  mapActionToMode: (label: string) => {
    if (label === 'Edit photo') return 'avatar';
    if (label === 'Change password') return 'password';
    if (label === 'Change username') return 'username';
    if (label === 'Change email') return 'login';
    return null;
  },
}));

// Простые моки компонентов
vi.mock('@/features/account/ProfileHeader', () => ({
  ProfileHeader: () => <div data-testid="profile-header">ProfileHeader</div>,
}));

vi.mock('@/features/account/ActionsList', () => ({
  ActionsList: ({ onClick }: any) => (
    <div data-testid="actions-list">
      <button onClick={() => onClick?.('Edit photo')}>Edit photo</button>
      <button onClick={() => onClick?.('Change password')}>
        Change password
      </button>
      <button onClick={() => onClick?.('Change username')}>
        Change username
      </button>
      <button onClick={() => onClick?.('Change email')}>Change email</button>
      <button onClick={() => onClick?.('Log out')}>Log out</button>
    </div>
  ),
}));

vi.mock('@/features/account/EditAccountModal', () => ({
  EditAccountModal: ({ open, onSave, onClose }: any) =>
    open ? (
      <div data-testid="edit-account-modal">
        <button onClick={onSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

describe('AccountPage - простой тест', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render without crashing', () => {
    const { container } = render(<AccountPage />);
    expect(container).toBeInTheDocument();
  });

  it('should render main elements', () => {
    render(<AccountPage />);

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('actions-list')).toBeInTheDocument();
  });

  it('should handle logout action', () => {
    localStorage.setItem('ap.auth.mock', 'true');

    render(<AccountPage />);

    // Находим кнопку Log out и кликаем
    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    // Проверяем что localStorage очистился
    expect(localStorage.getItem('ap.auth.mock')).toBe('false');
  });
});
