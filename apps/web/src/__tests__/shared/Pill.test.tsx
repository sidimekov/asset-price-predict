import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import Pill from '@/shared/ui/Pill';

describe('Pill component', () => {
  it('renders label text for default (asset) variant', () => {
    render(<Pill label="BTC 17,878" />);
    expect(
        screen.getByRole('button', { name: /BTC 17,878/i }),
    ).toBeInTheDocument();
  });

  it('applies selected / unselected classes based on selected prop', () => {
    const { rerender } = render(<Pill label="ETH 23.234" selected />);

    const button = screen.getByRole('button', { name: /ETH 23.234/i });
    expect(button.className).toContain('selected-pill');

    rerender(<Pill label="ETH 23.234" selected={false} />);
    expect(button.className).toContain('unselected-pill');
  });

  it('calls onClick handler when provided', () => {
    const onClick = vi.fn();
    render(<Pill label="LTC" onClick={onClick} />);
    const button = screen.getByRole('button', { name: /LTC/i });

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders add-asset variant correctly', () => {
    render(<Pill label="ignored" variant="add-asset" />);
    const button = screen.getByRole('button', { name: /\+ Add Asset/i });
    expect(button.className).toContain('add-asset-pill');
  });

  it('calls onRemove when close icon is clicked', () => {
    const onRemove = vi.fn();
    render(<Pill label="XRP" selected onRemove={onRemove} />);

    const closeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(closeButton);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});