import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AuthTabs from '@/features/auth/AuthTabs';

describe('AuthTabs', () => {
    it('renders two tabs with correct text', () => {
        render(<AuthTabs mode="signup" setMode={vi.fn()} />);
        expect(screen.getByRole('tab', { name: 'Sign up' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('highlights active tab with underline', () => {
        const { rerender } = render(<AuthTabs mode="signup" setMode={vi.fn()} />);
        expect(screen.getByRole('tab', { name: 'Sign up' })).toHaveStyle('text-decoration: underline');

        rerender(<AuthTabs mode="signin" setMode={vi.fn()} />);
        expect(screen.getByRole('tab', { name: 'Sign in' })).toHaveStyle('text-decoration: underline');
    });

    it('calls setMode on tab click', async () => {
        const setMode = vi.fn();
        render(<AuthTabs mode="signup" setMode={setMode} />);
        await userEvent.click(screen.getByRole('tab', { name: 'Sign in' }));
        expect(setMode).toHaveBeenCalledWith('signin');
    });

    it('applies focus outline', async () => {
        render(<AuthTabs mode="signup" setMode={vi.fn()} />);
        const tab = screen.getByRole('tab', { name: 'Sign up' });
        await userEvent.tab();
        expect(tab).toHaveStyle('outline: 2px solid #FF409A');
    });
});