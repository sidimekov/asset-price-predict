import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
  ProfileHeader: vi.fn(({ loading, onClick }) => (
    <div data-testid="profile-header" onClick={onClick}>
      ProfileHeader {loading ? 'loading' : 'loaded'}
    </div>
  )),
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
  )),
}));

describe('AccountPage', () => {
  it('renders profile header and actions list', async () => {
    localStorage.setItem('auth.token', 'test-token');
    render(<AccountPage />);

    // Ждем завершения загрузки
    await vi.waitFor(() => {
      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
      expect(screen.getByTestId('actions-list')).toBeInTheDocument();
    });
  });

  it('handles profile click', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    localStorage.setItem('auth.token', 'test-token');
    render(<AccountPage />);

    await vi.waitFor(() => {
      const profileHeader = screen.getByTestId('profile-header');
      fireEvent.click(profileHeader);
      expect(alertMock).toHaveBeenCalledWith('Go to Account Settings');
    });

    alertMock.mockRestore();
  });
});
