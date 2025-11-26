import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import XAxis from '@/widgets/chart/coordinates/XAxis';

describe('XAxis', () => {
  it('applies custom className', () => {
    const { container } = render(<XAxis className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });
});
