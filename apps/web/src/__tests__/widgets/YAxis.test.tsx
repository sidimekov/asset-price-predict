import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YAxis from '@/widgets/chart/coordinates/YAxis';

describe('YAxis', () => {
  it('renders price levels', () => {
    render(<YAxis />);
    expect(screen.getByText('6,500')).toBeInTheDocument();
    expect(screen.getByText('6,000')).toBeInTheDocument();
    expect(screen.getByText('5,500')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<YAxis className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('renders dynamic levels from values', () => {
    render(<YAxis values={[10, 20]} tickCount={3} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
