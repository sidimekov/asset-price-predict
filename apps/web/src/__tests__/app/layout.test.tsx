import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout from '@/app/layout';

// Мокаем next/font/google
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({ variable: '--font-geist-sans' })),
  Geist_Mono: vi.fn(() => ({ variable: '--font-geist-mono' })),
}));

// Мокаем CSS импорт
vi.mock('@/app/globals.css', () => ({}));

describe('RootLayout', () => {
  it('renders html, body and children', () => {
    render(
      <RootLayout>
        <div data-testid="child">Child Content</div>
      </RootLayout>,
    );

    // Проверяем document.documentElement (html)
    expect(document.documentElement.tagName).toBe('HTML');
    expect(document.documentElement.lang).toBe('en');

    // Проверяем body
    const body = document.body;
    expect(body).toBeInTheDocument();
    expect(body.className).toContain('--font-geist-sans');
    expect(body.className).toContain('--font-geist-mono');
    expect(body.className).toContain('antialiased');

    // Проверяем ребёнка
    const child = document.querySelector('[data-testid="child"]');
    expect(child).toBeInTheDocument();
    expect(child?.textContent).toBe('Child Content');
  });
});
