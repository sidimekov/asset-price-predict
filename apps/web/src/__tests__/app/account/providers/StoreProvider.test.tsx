import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StoreProvider } from '@/app/providers/StoreProvider';

describe('StoreProvider', () => {
  it('renders children', () => {
    render(
      <StoreProvider>
        <div data-testid="child">Hello</div>
      </StoreProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
