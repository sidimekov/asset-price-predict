import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LineChart from '@/widgets/chart/LineChart';

describe('LineChart', () => {
  it('renders empty state when no series', () => {
    render(<LineChart series={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders a path for series data', () => {
    const { container } = render(
      <LineChart
        series={[
          [1, 10],
          [2, 12],
          [3, 11],
        ]}
      />,
    );
    expect(container.querySelector('path')).toBeInTheDocument();
  });
});
