import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Skeleton from '@/shared/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default styles', () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild;

    expect(div).toHaveStyle({
      width: '100%',
      height: '48px',
      backgroundColor: '#2A265F',
      borderRadius: '8px',
      animation: 'pulse 1.5s ease-in-out infinite',
    });
  });
});
