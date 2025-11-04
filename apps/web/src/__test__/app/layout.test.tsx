import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout from '@/app/layout';

// Мокаем шрифты
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

// Мокаем CSS
vi.mock('../globals.css', () => ({}));

// Мокаем Sidebar
vi.mock('@/shared/sidebar/Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

describe('RootLayout', () => {
  it('renders layout with sidebar and children', () => {
    render(
      <RootLayout>
        <div data-testid="child">Page Content</div>
      </RootLayout>,
    );

    // HTML
    expect(document.documentElement).toHaveAttribute('lang', 'en');

    // Body
    const body = document.body;
    expect(body).toHaveClass(
      '--font-geist-sans',
      '--font-geist-mono',
      'antialiased',
    );
    expect(body.style.display).toBe('flex');
    expect(body.style.minHeight).toBe('100vh');
    expect(body.style.backgroundColor).toBe('rgb(23, 21, 59)');
    expect(body.style.color).toBe('rgb(255, 255, 255)');

    // Sidebar
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();

    // Main
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main?.style.padding).toBe('40px');
    expect(main?.style.overflowY).toBe('auto');

    // Children
    expect(screen.getByTestId('child')).toHaveTextContent('Page Content');
  });
});
