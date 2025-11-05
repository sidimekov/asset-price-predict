import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Skeleton from '@/shared/ui/Skeleton';

describe('Skeleton', () => {
  it('renders', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
