// EditAccountModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditAccountModal } from '@/features/account/EditAccountModal';

const mockProfile = {
  username: 'testuser',
  login: 'test@example.com',
  avatarUrl: 'https://example.com/avatar.jpg',
};

describe('EditAccountModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when open is false', () => {
    render(
      <EditAccountModal
        open={false}
        mode="profile"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.queryByText('Account settings')).not.toBeInTheDocument();
  });

  it('should render profile mode with correct fields', () => {
    render(
      <EditAccountModal
        open={true}
        mode="profile"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByText('Account settings')).toBeInTheDocument();

    // Используем ID или label вместо placeholder
    expect(
      screen.getByLabelText('Username', { selector: 'input' }),
    ).toHaveValue('testuser');
    expect(screen.getByLabelText('Login', { selector: 'input' })).toHaveValue(
      'test@example.com',
    );
    expect(
      screen.getByLabelText('Avatar URL', { selector: 'input' }),
    ).toHaveValue('https://example.com/avatar.jpg');
  });

  it('should render avatar mode with correct fields', () => {
    render(
      <EditAccountModal
        open={true}
        mode="avatar"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByText('Edit photo')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Avatar URL', { selector: 'input' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Username', { selector: 'input' }),
    ).not.toBeInTheDocument();
  });

  it('should render password mode with correct fields', () => {
    render(
      <EditAccountModal
        open={true}
        mode="password"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByText('Change password')).toBeInTheDocument();

    // Для PasswordInput используем getByLabelText с учетом aria-describedby
    expect(
      screen.getByLabelText('Current password', { selector: 'input' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('New password', { selector: 'input' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Confirm password', { selector: 'input' }),
    ).toBeInTheDocument();
  });

  it('should validate password - too short', () => {
    render(
      <EditAccountModal
        open={true}
        mode="password"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const newPasswordInput = screen.getByLabelText('New password', {
      selector: 'input',
    });
    const confirmPasswordInput = screen.getByLabelText('Confirm password', {
      selector: 'input',
    });

    fireEvent.change(newPasswordInput, {
      target: { value: '123' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(
      screen.getByText('New password must be at least 8 characters'),
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate password - mismatch', () => {
    render(
      <EditAccountModal
        open={true}
        mode="password"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const newPasswordInput = screen.getByLabelText('New password', {
      selector: 'input',
    });
    const confirmPasswordInput = screen.getByLabelText('Confirm password', {
      selector: 'input',
    });

    fireEvent.change(newPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'different' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate username - too short', () => {
    render(
      <EditAccountModal
        open={true}
        mode="username"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const usernameInput = screen.getByLabelText('Username', {
      selector: 'input',
    });

    fireEvent.change(usernameInput, {
      target: { value: 'ab' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(
      screen.getByText('Username must be at least 3 characters'),
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave when validation passes', () => {
    render(
      <EditAccountModal
        open={true}
        mode="username"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const usernameInput = screen.getByLabelText('Username', {
      selector: 'input',
    });

    fireEvent.change(usernameInput, {
      target: { value: 'newusername' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(mockOnSave).toHaveBeenCalledWith({ username: 'newusername' });
  });

  it('should call onClose when Cancel is clicked', () => {
    render(
      <EditAccountModal
        open={true}
        mode="profile"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show error from props', () => {
    render(
      <EditAccountModal
        open={true}
        mode="profile"
        profile={mockProfile}
        error="Server error occurred"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByText('Server error occurred')).toBeInTheDocument();
  });

  it('should disable Save button when loading', () => {
    render(
      <EditAccountModal
        open={true}
        mode="profile"
        profile={mockProfile}
        loading={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('should initialize form when opening modal', () => {
    const { rerender } = render(
      <EditAccountModal
        open={false}
        mode="profile"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    // Модалка закрыта
    expect(screen.queryByText('Account settings')).not.toBeInTheDocument();

    // Открываем модалку
    rerender(
      <EditAccountModal
        open={true}
        mode="profile"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    // Проверяем, что форма инициализирована
    expect(
      screen.getByLabelText('Username', { selector: 'input' }),
    ).toHaveValue('testuser');
  });

  it('should handle login validation - too short', () => {
    render(
      <EditAccountModal
        open={true}
        mode="login"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const loginInput = screen.getByLabelText('Login', { selector: 'input' });

    fireEvent.change(loginInput, {
      target: { value: 'ab' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(
      screen.getByText('Login must be at least 3 characters'),
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should update form fields when typing', () => {
    render(
      <EditAccountModal
        open={true}
        mode="username"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const usernameInput = screen.getByLabelText('Username', {
      selector: 'input',
    });

    fireEvent.change(usernameInput, {
      target: { value: 'updatedusername' },
    });

    expect(usernameInput).toHaveValue('updatedusername');
  });

  it('should show local error when validation fails', () => {
    render(
      <EditAccountModal
        open={true}
        mode="username"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const usernameInput = screen.getByLabelText('Username', {
      selector: 'input',
    });

    fireEvent.change(usernameInput, {
      target: { value: 'ab' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(
      screen.getByText('Username must be at least 3 characters'),
    ).toBeInTheDocument();
  });

  it('should clear local error when validation passes on second attempt', () => {
    render(
      <EditAccountModal
        open={true}
        mode="username"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const usernameInput = screen.getByLabelText('Username', {
      selector: 'input',
    });
    const saveButton = screen.getByText('Save');

    // Первая попытка - ошибка
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.click(saveButton);

    expect(
      screen.getByText('Username must be at least 3 characters'),
    ).toBeInTheDocument();

    // Вторая попытка - исправляем
    fireEvent.change(usernameInput, { target: { value: 'validusername' } });
    fireEvent.click(saveButton);

    // Ошибка должна исчезнуть
    expect(
      screen.queryByText('Username must be at least 3 characters'),
    ).not.toBeInTheDocument();
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should not call onSave when validation fails', () => {
    render(
      <EditAccountModal
        open={true}
        mode="login"
        profile={mockProfile}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const loginInput = screen.getByLabelText('Login', { selector: 'input' });

    fireEvent.change(loginInput, {
      target: { value: '' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
