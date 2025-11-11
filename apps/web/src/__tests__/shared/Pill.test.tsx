import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import Pill from '@/shared/ui/Pill';

describe('Pill component', () => {
  it('renders label text', () => {
    render(<Pill label="BTC 17,878" />);
    expect(
      screen.getByRole('button', { name: /BTC 17,878/i }),
    ).toBeInTheDocument();
  });

  it('renders skeleton when isSkeleton=true', () => {
    const { container } = render(<Pill isSkeleton />);
    const skeleton = container.querySelector('.bg-gray-700');
    expect(skeleton).toBeInTheDocument();
    // кнопка при этом не рендерится
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('toggles between selected and unselected on click', () => {
    render(<Pill label="ETH 23.234" variant="selected" />);
    const button = screen.getByRole('button');

    // изначально — selected
    expect(button.className).toContain('selected-pill');

    // клик — станет unselected
    fireEvent.click(button);
    expect(button.className).toContain('unselected-pill');

    // ещё один клик — снова selected
    fireEvent.click(button);
    expect(button.className).toContain('selected-pill');
  });

  it('calls onClick handler when provided', () => {
    const onClick = vi.fn();
    render(<Pill label="LTC" variant="unselected" onClick={onClick} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders add-asset variant correctly', () => {
    render(<Pill label="Add Asset" variant="add-asset" />);
    const button = screen.getByRole('button', { name: /Add Asset/i });
    expect(button.className).toContain('add-asset-pill');
  });
});
