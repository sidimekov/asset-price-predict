import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WelcomePage from '@/app/welcome/page';

// Мокаем всё, что вызывает useRouter
vi.mock('@/features/landing/TopBar', () => ({ TopBar: () => null }));
vi.mock('@/features/landing/Illustration', () => ({
  Illustration: () => null,
}));
vi.mock('@/features/landing/MainBanner', () => ({
  MainBanner: ({ onLearnMore }: any) => (
    <button onClick={onLearnMore}>Show</button>
  ),
}));
vi.mock('@/features/landing/MoreInfo', () => ({
  MoreInfo: () => <div>More Info</div>,
}));

describe('WelcomePage', () => {
  it('toggles MoreInfo', () => {
    render(<WelcomePage />);
    expect(screen.queryByText('More Info')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByText('More Info')).toBeInTheDocument();
  });
});
