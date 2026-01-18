import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignInForm from '@/features/auth/SignInForm';

vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, disabled, ariaBusy, ...props }: any) => (
    <button {...props} disabled={disabled} aria-busy={ariaBusy}>
      {children}
    </button>
  ),
}));
vi.mock('@/shared/ui/Skeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}));

describe('SignInForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders inputs with correct placeholders', () => {
    render(<SignInForm onSubmit={mockOnSubmit} isLoading={false} />);
    expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument();
  });

  it('shows skeletons when loading', () => {
    render(<SignInForm onSubmit={mockOnSubmit} isLoading={true} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(2);
  });

  it('disables button when loading', () => {
    render(<SignInForm onSubmit={mockOnSubmit} isLoading={true} />);
    const btn = screen.getByRole('button', { name: 'Confirm' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('submits valid form', async () => {
    render(<SignInForm onSubmit={mockOnSubmit} isLoading={false} />);
    await userEvent.type(
      screen.getByPlaceholderText('Your email'),
      'test@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Your password'),
      'pass123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'pass123',
    });
  });
});
