import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AccountPage from '@/app/account/page';

// Мокаем дочерние компоненты
vi.mock('@/features/account/ProfileHeader', () => ({
  ProfileHeader: vi.fn(({ profile, loading, onClick }) => (
    <div data-testid="profile-header" onClick={onClick}>
      ProfileHeader {loading ? 'loading' : 'loaded'}
      {profile?.username && <span>{profile.username}</span>}
    </div>
  )),
}));

vi.mock('@/features/account/ActionsList', () => ({
  ActionsList: vi.fn(({ loading, onClick }) => (
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
  )),
}));

vi.mock('@/features/account/EditAccountModal', () => ({
  EditAccountModal: vi.fn(({ open, mode, onClose, onSave }) =>
    open ? (
      <div data-testid="edit-account-modal">
        <span>Mode: {mode}</span>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onSave({})}>Save</button>
      </div>
    ) : null,
  ),
}));

describe('AccountPage', () => {
  it('renders profile header and actions list initially', async () => {
    render(<AccountPage />);

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('actions-list')).toBeInTheDocument();
  });

  it('opens modal on profile header click', async () => {
    render(<AccountPage />);

    const profileHeader = screen.getByTestId('profile-header');
    fireEvent.click(profileHeader);

    await waitFor(() => {
      const modal = screen.getByTestId('edit-account-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent('Mode: profile');
    });

    // После открытия модалки список кнопок должен быть скрыт
    expect(screen.queryByText('Edit photo')).toBeNull();
  });

  it('opens modal on action button click', async () => {
    render(<AccountPage />);

    const changeUsernameBtn = screen.getByRole('button', {
      name: 'Change username',
    });
    fireEvent.click(changeUsernameBtn);

    await waitFor(() => {
      const modal = screen.getByTestId('edit-account-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent('Mode: username');
    });

    // Список кнопок скрыт
    expect(screen.queryByText('Edit photo')).toBeNull();
  });

  it('closes modal on Cancel', async () => {
    render(<AccountPage />);

    const changeLoginBtn = screen.getByRole('button', { name: 'Change login' });
    fireEvent.click(changeLoginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('edit-account-modal')).toBeInTheDocument();
    });

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('edit-account-modal')).toBeNull();
    });

    // После закрытия модалки список кнопок снова виден
    expect(screen.getByText('Edit photo')).toBeVisible();
    expect(screen.getByText('Change password')).toBeVisible();
  });

  it('calls Save and closes modal', async () => {
    render(<AccountPage />);

    const editPhotoBtn = screen.getByRole('button', { name: 'Edit photo' });
    fireEvent.click(editPhotoBtn);

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('edit-account-modal')).toBeNull();
    });

    // Список кнопок снова виден
    expect(screen.getByText('Edit photo')).toBeVisible();
    expect(screen.getByText('Change password')).toBeVisible();
  });

  it('redirects to /auth on Log out', async () => {
    const pushMock = vi.fn();
    vi.mocked(require('next/navigation')).useRouter.mockReturnValue({
      push: pushMock,
    } as any);

    render(<AccountPage />);

    const logoutBtn = screen.getByRole('button', { name: 'Log out' });
    fireEvent.click(logoutBtn);

    // Проверяем, что router.push вызван
    expect(pushMock).toHaveBeenCalledWith('/auth');

    // Проверяем localStorage flag
    expect(localStorage.getItem('ap.auth.mock')).toBe('false');
  });
});
