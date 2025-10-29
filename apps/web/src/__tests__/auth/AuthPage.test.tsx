import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AuthPage from '@/app/auth/page';

vi.mock('@/features/auth/AuthBrand', () => ({
  default: () => <h1>AssetPredict</h1>,
}));
vi.mock('@/features/auth/AuthTabs', () => ({ default: () => null }));
vi.mock('@/features/auth/SignUpForm', () => ({
  default: () => (
    <form>
      <button type="submit">Sign Up</button>
    </form>
  ),
}));
vi.mock('@/features/auth/SignInForm', () => ({
  default: () => (
    <form>
      <button type="submit">Sign In</button>
    </form>
  ),
}));
vi.mock('@/shared/ui/GradientCard', () => ({
  GradientCard: ({ children }: any) => <div>{children}</div>,
}));

describe('AuthPage', () => {
  it('renders signup form by default', () => {
    render(<AuthPage />);
    expect(screen.getByText('Sign up for AssetPredict')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('switches to signin form on link click', async () => {
    render(<AuthPage />);
    await userEvent.click(screen.getByText('Already have an account? Sign in'));
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('contains AuthBrand and toggle link', () => {
    render(<AuthPage />);
    expect(
      screen.getByRole('heading', { name: 'AssetPredict' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Already have an account? Sign in'),
    ).toBeInTheDocument();
  });
});
