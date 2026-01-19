import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPage from '@/app/auth/page';
import { Suspense } from 'react';

// === МОК useSearchParams ===
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

vi.mock('@/features/auth/AuthBrand', () => ({
  default: () => <div data-testid="auth-brand">Brand</div>,
}));

vi.mock('@/features/auth/AuthTabs', () => ({
  default: ({ mode, setMode }: any) => (
    <div data-testid="auth-tabs" onClick={() => setMode('signin')}>
      Tabs: {mode}
    </div>
  ),
}));

vi.mock('@/features/auth/SignUpForm', () => ({
  default: ({ onSubmit, isLoading }: any) => (
    <form data-testid="signup-form" onSubmit={onSubmit}>
      {isLoading ? 'Submitting...' : 'Sign Up'}
    </form>
  ),
}));

vi.mock('@/features/auth/SignInForm', () => ({
  default: ({ onSubmit, isLoading }: any) => (
    <form data-testid="signin-form" onSubmit={onSubmit}>
      {isLoading ? 'Submitting...' : 'Sign In'}
    </form>
  ),
}));

vi.mock('@/shared/ui/GradientCard', () => ({
  GradientCard: ({ children, className }: any) => (
    <div data-testid="gradient-card" className={className}>
      {children}
    </div>
  ),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null); // по умолчанию
  });

  test('initializes with signup mode by default', async () => {
    mockGet.mockReturnValue(null);
    render(<AuthPage />);

    await waitFor(() => {
      expect(screen.getByText(/Sign up for AssetPredict/i)).toBeInTheDocument();
      expect(screen.getByTestId('signup-form')).toBeInTheDocument();
    });
  });

  test('uses url mode=signin from searchParams', async () => {
    mockGet.mockReturnValue('signin');
    render(<AuthPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByTestId('signin-form')).toBeInTheDocument();
    });
  });

  test('toggles mode via AuthTabs', async () => {
    mockGet.mockReturnValue(null);
    render(<AuthPage />);

    await waitFor(() => screen.getByTestId('auth-tabs'));

    fireEvent.click(screen.getByTestId('auth-tabs'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-tabs')).toHaveTextContent('signin');
    });
  });

  test('handles form submit with loading state and alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    mockGet.mockReturnValue(null);
    render(<AuthPage />);

    await waitFor(() => screen.getByTestId('signup-form'));

    const form = screen.getByTestId('signup-form');
    fireEvent.submit(form);

    expect(screen.getByTestId('signup-form')).toHaveTextContent(
      'Submitting...',
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Зарегистрировано (мок)');
      expect(screen.getByTestId('signup-form')).toHaveTextContent('Sign Up');
    });

    alertSpy.mockRestore();
  });

  test('has correct responsive classes', async () => {
    mockGet.mockReturnValue(null);
    render(<AuthPage />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('pt-6', 'pb-4', 'px-6');
    expect(header).toHaveClass('mobile:pt-5', 'mobile:pb-3', 'mobile:px-4');

    const main = screen.getByRole('main');
    expect(main).toHaveClass('px-6', 'mobile:px-4');

    const wrapper = screen.getByTestId('gradient-card').parentElement;
    expect(wrapper).toHaveClass(
      'w-full',
      'max-w-md',
      'mobile:w-90',
      'mobile:max-w-md',
    );

    const card = screen.getByTestId('gradient-card');
    expect(card).toHaveClass('py-10', 'mobile:py-8');
  });
});
