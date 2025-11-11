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

  it('applies selected/unselected classes based on props', () => {
    const { rerender } = render(<Pill label="ETH 23.234" selected />);
    const button = screen.getByRole('button');

    expect(button.className).toContain('selected-pill');

    rerender(<Pill label="ETH 23.234" selected={false} />);
    expect(button.className).toContain('unselected-pill');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Pill label="LTC" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders add-asset variant', () => {
    render(<Pill label="+ Add Asset" variant="add-asset" />);
    const btn = screen.getByRole('button', { name: /\+ Add Asset/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('add-asset-pill');
  });

  it('shows remove cross and calls onRemove without triggering onClick', () => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    render(<Pill label="BTC 10.00" onRemove={onRemove} onClick={onClick} />);

    // крестик — это элемент с aria-label="remove"
    const cross = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(cross);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled(); // благодаря stopPropagation
  });
});
