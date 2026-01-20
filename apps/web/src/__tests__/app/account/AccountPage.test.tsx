import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountPage from '@/app/account/page';

const mockReplace = vi.fn();
const mockLogout = vi.fn();
const mockDispatch = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@/shared/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock('@/shared/api/account.api', () => ({
  useGetMeQuery: () => ({
    data: {
      id: '1',
      username: 'User',
      email: 'user@example.com',
    },
    isFetching: false,
    isLoading: false,
  }),
}));

vi.mock('@/shared/api/auth.api', () => ({
  useLogoutMutation: () => [mockLogout],
}));

// Мокаем дочерние компоненты
vi.mock('@/features/account/ProfileHeader', () => ({
  ProfileHeader: () => <div data-testid="profile-header">ProfileHeader</div>,
}));

vi.mock('@/features/account/ActionsList', () => ({
  ActionsList: vi.fn(({ loading, onClick, onLogout }) => (
    <div
      data-testid="actions-list"
      onClick={() => {
        onClick?.('test');
        onLogout?.();
      }}
    >
      ActionsList {loading ? 'loading' : 'loaded'}
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

describe('AccountPage', () => {
  it('renders profile header and actions list', async () => {
    localStorage.setItem('auth.token', 'test-token');
    render(<AccountPage />);

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('actions-list')).toBeInTheDocument();
  });

  it('should handle logout action', () => {
    localStorage.setItem('ap.auth.mock', 'true');

    localStorage.setItem('auth.token', 'test-token');
    render(<AccountPage />);

    // Находим кнопку Log out и кликаем
    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    // Проверяем что localStorage очистился
    expect(localStorage.getItem('ap.auth.mock')).toBe('false');
  });
});
