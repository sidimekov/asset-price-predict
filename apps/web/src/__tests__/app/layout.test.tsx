import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout from '@/app/layout';

// Мокаем next/font/google — не используется в текущем layout
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({ variable: '--font-geist-sans' })),
  Geist_Mono: vi.fn(() => ({ variable: '--font-geist-mono' })),
}));

// Мокаем CSS импорт
vi.mock('@/app/globals.css', () => ({}));

describe('RootLayout', () => {
  it('renders html, body and children with correct lang and classes', () => {
    render(
      <RootLayout>
        <div data-testid="child">Child Content</div>
      </RootLayout>,
    );

    // Проверка <html lang="ru">
    expect(document.documentElement.tagName).toBe('HTML');
    expect(document.documentElement.lang).toBe('ru');

    // Проверка <body> и его классов
    const body = document.body;
    expect(body).toBeInTheDocument();
    expect(body.className).toContain('bg-primary');
    expect(body.className).toContain('text-ink');
    expect(body.className).toContain('font-sans');
    expect(body.className).toContain('antialiased');
    expect(body.className).toContain('min-h-screen');

    // Проверка дочернего контента
    const child = screen.getByTestId('child');
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe('Child Content');
  });
});
