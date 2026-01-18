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

  it('renders all four inputs', () => {
    render(<SignUpForm onSubmit={mockOnSubmit} isLoading={false} />);
    expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Your username (optional)'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Your password again'),
    ).toBeInTheDocument();
  });

  it('shows four skeletons when loading', () => {
    render(<SignUpForm onSubmit={mockOnSubmit} isLoading={true} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
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
      screen.getByPlaceholderText('Your username (optional)'),
      'tester',
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
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'pass123',
      username: 'tester',
    });
  });

  it('shows validation errors for invalid inputs', async () => {
    render(<SignUpForm onSubmit={mockOnSubmit} isLoading={false} />);

    await userEvent.type(screen.getByPlaceholderText('Your email'), 'invalid');
    await userEvent.type(
      screen.getByPlaceholderText('Your password'),
      'pass123',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Your password again'),
      'different',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(
      screen.getByText('Please enter the correct email address'),
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits without username when whitespace', async () => {
    render(<SignUpForm onSubmit={mockOnSubmit} isLoading={false} />);

    await userEvent.type(
      screen.getByPlaceholderText('Your email'),
      'test@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Your username (optional)'),
      '   ',
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

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'pass123',
      username: undefined,
    });
  });

  it('renders server errors and message', () => {
    render(
      <SignUpForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        serverErrors={{ email: 'Server email error' }}
        serverMessage="Validation failed"
      />,
    );

    expect(screen.getByText('Validation failed')).toBeInTheDocument();
    expect(screen.getByText('Server email error')).toBeInTheDocument();
  });
});
