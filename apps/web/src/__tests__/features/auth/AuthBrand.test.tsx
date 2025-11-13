import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AuthBrand from '@/features/auth/AuthBrand';

describe('AuthBrand', () => {
  it('renders AssetPredict', () => {
    render(<AuthBrand />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'AssetPredict',
    );
  });
});
