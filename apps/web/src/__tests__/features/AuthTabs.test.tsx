import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AuthTabs from '@/features/auth/AuthTabs';

describe('AuthTabs', () => {
  it('renders two tabs', () => {
    render(<AuthTabs mode="signup" setMode={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    const { rerender } = render(<AuthTabs mode="signup" setMode={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Sign up' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    rerender(<AuthTabs mode="signin" setMode={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Sign in' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('calls setMode on click', async () => {
    const setMode = vi.fn();
    render(<AuthTabs mode="signup" setMode={setMode} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Sign in' }));
    expect(setMode).toHaveBeenCalledWith('signin');
  });
});
