import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AuthBrand from '@/features/auth/AuthBrand';

describe('AuthBrand', () => {
  it('renders "Asset" with gradient and "Predict" in white', () => {
    render(<AuthBrand />);
    const h1 = screen.getByRole('heading', { level: 1 });

    const html = h1.innerHTML;

    // Проверяем градиент (в rgb, как рендерит браузер)
    expect(html).toContain(
      'linear-gradient(to right, rgb(255, 64, 154), rgb(196, 56, 239))',
    );
    expect(html).toContain('color: transparent'); // для Asset
    expect(html).toContain('color: rgb(255, 255, 255)'); // для Predict
  });

  it('applies custom style to h1', () => {
    render(<AuthBrand style={{ fontSize: '60px' }} />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveStyle('font-size: 60px');
  });
});
