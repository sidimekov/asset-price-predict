import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GradientCard } from '@/shared/ui/GradientCard';

describe('GradientCard', () => {
  it('renders with gradient-card class', () => {
    render(
      <GradientCard className="py-10">
        <div data-testid="child">Test</div>
      </GradientCard>,
    );
    const card = screen.getByTestId('child').parentElement;
    expect(card).toHaveClass('gradient-card', 'py-10');
  });
});
