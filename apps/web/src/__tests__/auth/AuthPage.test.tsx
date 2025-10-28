import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthPage from '@/app/auth/page';

vi.mock('@/features/auth/AuthBrand', () => ({ default: () => <div>AssetPredict</div> }));
vi.mock('@/features/auth/AuthTabs', () => ({ default: () => null }));
vi.mock('@/features/auth/SignUpForm', () => ({
    default: ({ onSubmit, isLoading }: any) => (
        <form onSubmit={onSubmit}>
            <button type="submit" disabled={isLoading} aria-busy={isLoading}>
                Confirm
            </button>
        </form>
    ),
}));
vi.mock('@/features/auth/SignInForm', () => ({
    default: ({ onSubmit, isLoading }: any) => (
        <form onSubmit={onSubmit}>
            <button type="submit" disabled={isLoading} aria-busy={isLoading}>
                Confirm
            </button>
        </form>
    ),
}));

describe('AuthPage', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should render in signup mode by default', () => {
        render(<AuthPage />);
        expect(screen.getByText('Sign up for AssetPredict')).toBeInTheDocument();
    });

    it('has a link to switch to signin', () => {
        render(<AuthPage />);
        expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument();
    });

});