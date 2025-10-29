import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GradientCard } from '@/shared/ui/GradientCard';

describe('GradientCard', () => {
  it('renders children with default gradient styles', () => {
    render(
      <GradientCard>
        <span data-testid="child">Test Content</span>
      </GradientCard>,
    );

    const card = screen.getByTestId('child').parentElement;
    const child = screen.getByTestId('child');

    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({
      background: 'linear-gradient(135deg, #FF409A, #C438EF, #201D47)',
      borderRadius: '32px',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
      padding: '24px',
    });
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Test Content');
  });

  it('applies custom style override', () => {
    render(
      <GradientCard style={{ padding: '40px', borderRadius: '16px' }}>
        <div data-testid="child" />
      </GradientCard>,
    );

    const card = screen.getByTestId('child').parentElement;
    expect(card).toHaveStyle({
      padding: '40px',
      borderRadius: '16px',
    });
  });
});
