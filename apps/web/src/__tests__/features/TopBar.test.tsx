import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '@/features/landing/TopBar';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSessionStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
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

  it('navigates to signin with sessionStorage on "Sign in"', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText('Sign in'));
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'authMode',
      'signin',
    );
    expect(mockPush).toHaveBeenCalledWith('/auth');
  });

  it('navigates to signup with sessionStorage on "Sign up"', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText('Sign up'));
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'authMode',
      'signup',
    );
    expect(mockPush).toHaveBeenCalledWith('/auth');
  });
});
