import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AuthPage from '@/app/auth/page';

vi.mock('@/features/auth/AuthBrand', () => ({
  default: () => <h1 className="text-5xl">AssetPredict</h1>,
}));
vi.mock('@/features/auth/AuthTabs', () => ({
  default: () => null,
}));
vi.mock('@/features/auth/SignUpForm', () => ({
  default: ({ onSubmit }: any) => (
    <form onSubmit={onSubmit}>
      <input placeholder="Your email" />
      <input placeholder="Your password" />
      <input placeholder="Your password again" />
      <button type="submit">Confirm</button>
    </form>
  ),
}));
vi.mock('@/features/auth/SignInForm', () => ({
  default: ({ onSubmit }: any) => (
    <form onSubmit={onSubmit}>
      <input placeholder="Your email" />
      <input placeholder="Your password" />
      <button type="submit">Confirm</button>
    </form>
  ),
}));
vi.mock('@/shared/ui/GradientCard', () => ({
  GradientCard: ({ children }: any) => (
    <div className="gradient-card py-10">{children}</div>
  ),
}));

describe('AuthPage', () => {
  it('renders signup form by default', () => {
    render(<AuthPage />);
    expect(screen.getByText('Sign up for AssetPredict')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument();
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

  it('contains AuthBrand and toggle link', () => {
    render(<AuthPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'AssetPredict',
    );
    expect(
      screen.getByText('Already have an account? Sign in'),
    ).toBeInTheDocument();
  });

  it('has correct header padding', () => {
    render(<AuthPage />);
    const header = screen.getByRole('heading', { level: 1 }).closest('header');
    expect(header).toHaveClass('pt-6', 'pb-4', 'px-6');
  });

  it('card has increased height', () => {
    render(<AuthPage />);
    const card = screen
      .getByText('Sign up for AssetPredict')
      .closest('.gradient-card');
    expect(card).toHaveClass('py-10');
  });
});
