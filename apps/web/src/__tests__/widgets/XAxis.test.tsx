import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import XAxis from '@/widgets/chart/coordinates/XAxis';

describe('XAxis', () => {
  it('applies custom className', () => {
    const { container } = render(<XAxis className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('renders labels from timestamps', () => {
    render(
      <XAxis
        timestamps={[0, 3_600_000, 7_200_000, 10_800_000]}
        tickCount={4}
      />,
    );

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('01:00')).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument();
    expect(screen.getByText('03:00')).toBeInTheDocument();
  });

  it('renders explicit labels when provided', () => {
    render(<XAxis labels={['Start', 'Middle', 'End']} />);

    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Middle')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
  });

  it('renders a single label when only one is provided', () => {
    render(<XAxis labels={['Only']} />);
    expect(screen.getByText('Only')).toBeInTheDocument();
  });

  it('renders no ticks when timestamps are invalid', () => {
    const { container } = render(<XAxis timestamps={[Number.NaN]} />);
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  it('formats monthly ranges without placeholder labels', () => {
    const january = new Date('2024-01-01T00:00:00Z').getTime();
    const february = new Date('2024-02-15T00:00:00Z').getTime();
    const { container } = render(
      <XAxis timestamps={[january, february]} tickCount={2} />,
    );

    const monthlyTicks = Array.from(container.querySelectorAll('span'));
    expect(monthlyTicks.length).toBeGreaterThan(0);
    monthlyTicks.forEach((tick) => {
      expect(tick.textContent).not.toBe('—');
    });
  });

  it('renders a day label when timestamps cross days in a short range', () => {
    const beforeMidnight = new Date('2024-01-01T23:00:00Z').getTime();
    const afterMidnight = new Date('2024-01-02T01:00:00Z').getTime();

    const { container } = render(
      <XAxis timestamps={[beforeMidnight, afterMidnight]} tickCount={2} />,
    );

    const ticks = Array.from(container.querySelectorAll('span'));
    expect(ticks.length).toBeGreaterThan(0);
    ticks.forEach((tick) => {
      expect(tick.textContent).not.toBe('—');
    });
  });

  it('formats daily ranges without placeholder labels', () => {
    const dayOne = new Date('2024-01-01T00:00:00Z').getTime();
    const dayTwo = new Date('2024-01-02T00:00:00Z').getTime();
    const { container } = render(
      <XAxis timestamps={[dayOne, dayTwo]} tickCount={2} />,
    );

    const ticks = Array.from(container.querySelectorAll('span'));
    expect(ticks.length).toBeGreaterThan(0);
    ticks.forEach((tick) => {
      expect(tick.textContent).not.toBe('—');
    });
  });
});
