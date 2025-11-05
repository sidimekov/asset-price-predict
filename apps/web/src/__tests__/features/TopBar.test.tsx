import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '@/features/landing/TopBar';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo with gradient and white text', () => {
    render(<TopBar />);
    const asset = screen.getByText('Asset');
    const predict = screen.getByText('Predict');
    expect(asset).toHaveClass('brand-gradient');
    expect(predict).toHaveClass('text-white');
  });

  it('navigates to home on logo click', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('heading', { name: /AssetPredict/i }));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates to signin with ?mode=signin on "Sign in"', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText('Sign in'));
    expect(mockPush).toHaveBeenCalledWith('/auth?mode=signin');
  });

  it('navigates to signup with ?mode=signup on "Sign up"', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText('Sign up'));
    expect(mockPush).toHaveBeenCalledWith('/auth?mode=signup');
  });
});