import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignUpForm from '@/features/auth/SignUpForm';

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

describe('SignUpForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all three inputs', () => {
    render(<SignUpForm onSubmit={mockOnSubmit} isLoading={false} />);
    expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Your password again'),
    ).toBeInTheDocument();
  });

  it('shows three skeletons when loading', () => {
    render(<SignUpForm onSubmit={mockOnSubmit} isLoading={true} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('disables button when loading', () => {
    render(<SignUpForm onSubmit={mockOnSubmit} isLoading={true} />);
    const btn = screen.getByRole('button', { name: 'Confirm' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('submits form with matching passwords', async () => {
    render(<SignUpForm onSubmit={mockOnSubmit} isLoading={false} />);
    await userEvent.type(
      screen.getByPlaceholderText('Your email'),
      'test@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Your password'),
      'pass123',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Your password again'),
      'pass123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });
});
