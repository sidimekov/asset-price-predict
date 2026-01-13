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
});
