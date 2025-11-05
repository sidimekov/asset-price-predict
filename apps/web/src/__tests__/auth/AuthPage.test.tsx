import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthPage from '@/app/auth/page';

// Моки компонентов
vi.mock('@/features/auth/AuthBrand', () => ({
  default: () => <div data-testid="auth-brand">AssetPredict</div>,
}));
vi.mock('@/features/auth/AuthTabs', () => ({
  default: () => null,
}));
vi.mock('@/features/auth/SignUpForm', () => ({
  default: () => (
    <form data-testid="signup-form">
      <input placeholder="Your email" />
      <input placeholder="Your password" />
      <input placeholder="Your password again" />
      <button>Confirm</button>
    </form>
  ),
}));
vi.mock('@/features/auth/SignInForm', () => ({
  default: () => (
    <form data-testid="signin-form">
      <input placeholder="Your email" />
      <input placeholder="Your password" />
      <button>Confirm</button>
    </form>
  ),
}));
vi.mock('@/shared/ui/GradientCard', () => ({
  GradientCard: ({ children }: any) => (
    <div data-testid="gradient-card" className="py-10">
      {children}
    </div>
  ),
}));

// Мок useSearchParams — только для тестов с URL
const mockUseSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue({
      get: () => null, // по умолчанию
    });
  });

  it('renders signup form by default', () => {
    render(<AuthPage />);
    expect(screen.getByText('Sign up for AssetPredict')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Your password again'),
    ).toBeInTheDocument();
  });

  it('switches to signin form on link click', async () => {
    render(<AuthPage />);
    await userEvent.click(screen.getByText('Already have an account? Sign in'));
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Your password again'),
    ).not.toBeInTheDocument();
  });

  it('opens signin when ?mode=signin', () => {
    mockUseSearchParams.mockReturnValue({
      get: () => 'signin',
    });
    render(<AuthPage />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('opens signup when ?mode=signup', () => {
    mockUseSearchParams.mockReturnValue({
      get: () => 'signup',
    });
    render(<AuthPage />);
    expect(screen.getByText('Sign up for AssetPredict')).toBeInTheDocument();
  });

  it('contains AuthBrand and toggle link', () => {
    render(<AuthPage />);
    expect(screen.getByTestId('auth-brand')).toBeInTheDocument();
    expect(
      screen.getByText('Already have an account? Sign in'),
    ).toBeInTheDocument();
  });

  it('has correct header padding', () => {
    render(<AuthPage />);
    const header = screen.getByTestId('auth-brand').closest('header');
    expect(header).toHaveClass('pt-6', 'pb-4', 'px-6');
  });

  it('card has increased height', () => {
    render(<AuthPage />);
    expect(screen.getByTestId('gradient-card')).toHaveClass('py-10');
  });
});
