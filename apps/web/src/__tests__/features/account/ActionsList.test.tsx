import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionsList } from '@/features/account/ActionsList';

// Мокаем дочерние компоненты
vi.mock('@/shared/ui/Button', () => ({
  Button: vi.fn(({ children, onClick, variant }) => (
    <button data-testid="button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  )),
}));

vi.mock('@/shared/ui/Skeleton', () => ({
  default: vi.fn(({ height }) => (
    <div data-testid="skeleton" style={{ height }}>
      Skeleton
    </div>
  )),
}));

describe('ActionsList', () => {
  const mockOnAction = vi.fn();
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // Очищаем DOM после каждого теста
  });

  it('renders loading state with skeletons', () => {
    render(<ActionsList loading={true} onAction={mockOnAction} />);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(5);
  });

  it('renders action buttons when not loading', () => {
    render(<ActionsList loading={false} onAction={mockOnAction} />);

    const buttons = screen.getAllByTestId('button');
    expect(buttons).toHaveLength(5);

    expect(buttons[0]).toHaveTextContent('Change photo');
    expect(buttons[1]).toHaveTextContent('Change password');
    expect(buttons[2]).toHaveTextContent('Change username');
    expect(buttons[3]).toHaveTextContent('Change email');
    expect(buttons[4]).toHaveTextContent('Log out');
    expect(buttons[4]).toHaveAttribute('data-variant', 'danger');
  });

  it('calls onAction with correct action when button clicked', () => {
    render(<ActionsList loading={false} onAction={mockOnAction} />);

    const changePhotoButton = screen.getByText('Change photo');
    fireEvent.click(changePhotoButton);
    expect(mockOnAction).toHaveBeenCalledWith('avatar');

    const changePasswordButton = screen.getByText('Change password');
    fireEvent.click(changePasswordButton);
    expect(mockOnAction).toHaveBeenCalledWith('password');

    const changeUsernameButton = screen.getByText('Change username');
    fireEvent.click(changeUsernameButton);
    expect(mockOnAction).toHaveBeenCalledWith('username');

    const changeEmailButton = screen.getByText('Change email');
    fireEvent.click(changeEmailButton);
    expect(mockOnAction).toHaveBeenCalledWith('email');
  });

  it('calls onLogout when logout button clicked', () => {
    render(
      <ActionsList
        loading={false}
        onAction={mockOnAction}
        onLogout={mockOnLogout}
      />,
    );

    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('does not require onLogout prop', () => {
    render(<ActionsList loading={false} onAction={mockOnAction} />);

    const logoutButton = screen.getByText('Log out');
    expect(() => fireEvent.click(logoutButton)).not.toThrow();
  });

  it('passes correct action types to onAction', () => {
    const testCases = [
      { buttonText: 'Change photo', expectedAction: 'avatar' as const },
      { buttonText: 'Change password', expectedAction: 'password' as const },
      { buttonText: 'Change username', expectedAction: 'username' as const },
      { buttonText: 'Change email', expectedAction: 'email' as const },
    ];

    testCases.forEach(({ buttonText, expectedAction }) => {
      vi.clearAllMocks();
      cleanup(); // Очищаем DOM перед каждым тестом в цикле
      render(<ActionsList loading={false} onAction={mockOnAction} />);

      const button = screen.getByText(buttonText);
      fireEvent.click(button);

      expect(mockOnAction).toHaveBeenCalledWith(expectedAction);
    });
  });

  it('applies danger variant to logout button', () => {
    render(<ActionsList loading={false} onAction={mockOnAction} />);

    const buttons = screen.getAllByTestId('button');
    const logoutButton = buttons[4];

    expect(logoutButton).toHaveAttribute('data-variant', 'danger');

    // Проверяем, что остальные кнопки не имеют variant="danger"
    buttons.slice(0, 4).forEach((button) => {
      expect(button).not.toHaveAttribute('data-variant', 'danger');
    });
  });

  it('should not call onAction when clicking logout button', () => {
    render(
      <ActionsList
        loading={false}
        onAction={mockOnAction}
        onLogout={mockOnLogout}
      />,
    );

    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    expect(mockOnAction).not.toHaveBeenCalled();
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });
});
