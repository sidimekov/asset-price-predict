import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ForecastShapePlaceholder from '@/widgets/chart/ForecastShapePlaceholder';

describe('ForecastShapePlaceholder', () => {
  it('renders placeholder when no series', () => {
    render(<ForecastShapePlaceholder />);
    expect(screen.getByText('Forecast shape')).toBeInTheDocument();
  });

  it('renders line without band when only p50 provided', () => {
    const { container } = render(
      <ForecastShapePlaceholder
        p50={[
          [1, 10],
          [2, 11],
        ]}
      />,
    );

    expect(container.querySelector('polyline')).toBeInTheDocument();
    expect(container.querySelector('polygon')).not.toBeInTheDocument();
  });

  it('renders band when p10 and p90 provided', () => {
    const { container } = render(
      <ForecastShapePlaceholder
        p50={[
          [1, 10],
          [2, 11],
        ]}
        p10={[
          [1, 9],
          [2, 10],
        ]}
        p90={[
          [1, 12],
          [2, 13],
        ]}
      />,
    );

    expect(container.querySelector('polygon')).toBeInTheDocument();
  });
});
