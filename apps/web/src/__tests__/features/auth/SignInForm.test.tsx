import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'pass123',
    });
  });

  it('shows validation errors for invalid inputs', async () => {
    render(<SignInForm onSubmit={mockOnSubmit} isLoading={false} />);

    const form = screen
      .getByRole('button', { name: 'Confirm' })
      .closest('form');
    fireEvent.submit(form!);

    expect(
      screen.getByText('Please enter the correct email address'),
    ).toBeInTheDocument();
    expect(screen.getByText("The password can't be empty")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('renders server errors and message', () => {
    render(
      <SignInForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        serverErrors={{ email: 'Server email error' }}
        serverMessage="Invalid credentials"
      />,
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByText('Server email error')).toBeInTheDocument();
  });
});
