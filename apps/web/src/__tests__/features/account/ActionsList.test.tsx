import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
  it('renders loading state with skeletons', () => {
    render(<ActionsList loading={true} />);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(5); // 4 обычных + 1 для кнопки выхода
  });

  it('renders action buttons when not loading', () => {
    render(<ActionsList loading={false} />);

    const buttons = screen.getAllByTestId('button');
    expect(buttons).toHaveLength(5); // 4 действия + выход

    expect(buttons[0]).toHaveTextContent('Edit photo');
    expect(buttons[1]).toHaveTextContent('Change password');
    expect(buttons[2]).toHaveTextContent('Change username');
    expect(buttons[3]).toHaveTextContent('Change email');
    expect(buttons[4]).toHaveTextContent('Log out');
    expect(buttons[4]).toHaveAttribute('data-variant', 'danger');
  });

  it('calls onClick with correct label when button clicked', () => {
    const handleClick = vi.fn();
    render(<ActionsList loading={false} onClick={handleClick} />);

    const editPhotoButton = screen.getByText('Edit photo');
    fireEvent.click(editPhotoButton);

    expect(handleClick).toHaveBeenCalledWith('Edit photo');
  });

  it('calls onLogout when logout button clicked', () => {
    const handleLogout = vi.fn();
    render(<ActionsList loading={false} onLogout={handleLogout} />);

    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('shows alert when button clicked without onClick prop', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ActionsList loading={false} />);

    const editPhotoButton = screen.getByText('Edit photo');
    fireEvent.click(editPhotoButton);

    expect(alertMock).toHaveBeenCalledWith('Edit photo — Not implemented');
    alertMock.mockRestore();
  });
});
