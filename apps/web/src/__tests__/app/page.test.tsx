import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from '@/app/page';

describe('Home', () => {
  it('renders main content and footer', () => {
    const { container } = render(<Home />);

    const main = container.querySelector('main');
    const footer = container.querySelector('footer');

    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });
});
