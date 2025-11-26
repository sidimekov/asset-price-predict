import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';

describe('CandlesChartPlaceholder', () => {
  it('renders empty state', () => {
    render(<CandlesChartPlaceholder state="empty" />);
    expect(
      screen.getByText('Select or add asset to view chart'),
    ).toBeInTheDocument();
  });

  it('renders ready state', () => {
    render(<CandlesChartPlaceholder state="ready" />);
    expect(screen.getByText('Chart Placeholder')).toBeInTheDocument();
  });
});
