import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CandlesChart from '@/widgets/chart/CandlesChart';

describe('CandlesChart', () => {
  it('renders empty state when not enough valid bars', () => {
    render(<CandlesChart bars={[[1, 1, 1, 1, NaN]]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders candles for valid bars and skips invalid ones', () => {
    const bars = [
      [1, 10, 12, 9, 11],
      [2, 11, 13, 10, 12],
      [3, 12, 14, 11, NaN],
    ];
    const { container } = render(<CandlesChart bars={bars} />);
    const rects = container.querySelectorAll('rect');
    const lines = container.querySelectorAll('line');
    expect(rects.length).toBe(2);
    expect(lines.length).toBe(2);
  });

  it('handles flat values and down candles', () => {
    const bars = [
      [1, 10, 10, 10, 9],
      [2, 9, 9, 9, 9],
    ];
    const { container } = render(<CandlesChart bars={bars} />);
    const rects = container.querySelectorAll('rect');
    const lines = container.querySelectorAll('line');
    expect(rects.length).toBe(2);
    expect(lines.length).toBe(2);
  });
});
