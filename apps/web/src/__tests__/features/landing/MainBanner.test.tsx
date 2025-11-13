import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainBanner } from '@/features/landing/MainBanner';

// Мок next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Мок Button
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
    <button onClick={onClick} aria-label={ariaLabel} data-testid="button">
      {children}
    </button>
  ),
}));

describe('MainBanner', () => {
  test('renders two buttons with correct labels', () => {
    render(<MainBanner onLearnMore={() => {}} />);

    const buttons = screen.getAllByTestId('button');
    expect(buttons).toHaveLength(2);

    expect(buttons[0]).toHaveTextContent('get started');
    expect(buttons[0]).toHaveAttribute('aria-label', 'Get started');

    expect(buttons[1]).toHaveTextContent('learn more');
    expect(buttons[1]).toHaveAttribute('aria-label', 'Learn more');
  });

  test('calls onLearnMore when "learn more" is clicked', () => {
    const onLearnMore = vi.fn();
    render(<MainBanner onLearnMore={onLearnMore} />);

    const learnMoreBtn = screen.getByText('learn more');
    fireEvent.click(learnMoreBtn);

    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  test('has correct layout classes', () => {
    render(<MainBanner onLearnMore={() => {}} />);

    const container = screen.getByRole('heading', { level: 1 }).parentElement;
    expect(container).toHaveClass(
      'flex',
      'flex-col',
      'justify-center',
      'min-h-60vh',
    );
    expect(container).toHaveClass('gap-8', 'text-left', 'px-8', 'max-w-xl');

    const buttonContainer = container?.querySelector('div');
    expect(buttonContainer).toHaveClass('flex', 'flex-row', 'gap-6', 'mt-8');
  });
});
