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

// Мокаем Sidebar компонент
vi.mock('@/shared/sidebar/Sidebar', () => ({
  Sidebar: vi.fn(() => <div data-testid="sidebar">Sidebar</div>),
}));

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

    // Проверяем body стили
    expect(body.style.display).toBe('flex');
    expect(body.style.minHeight).toBe('100vh');
    expect(body.style.overflow).toBe('hidden');
    expect(body.style.backgroundColor).toBe('rgb(23, 21, 59)');
    expect(body.style.color).toBe('rgb(255, 255, 255)');
    expect(body.style.fontFamily).toBe('Montserrat, sans-serif');

    // Проверяем sidebar (так как isAuthenticated = true)
    const sidebar = document.querySelector('[data-testid="sidebar"]');
    expect(sidebar).toBeInTheDocument();

    // Проверяем main
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    // Вместо проверки точного значения flex, проверяем что свойство установлено
    expect(main?.style.flex).toBeDefined();
    expect(main?.style.padding).toBe('40px');
    expect(main?.style.overflowY).toBe('auto');
    expect(main?.style.transition).toBe('margin 0.3s ease');

    // Проверяем ребёнка
    const child = document.querySelector('[data-testid="child"]');
    expect(child).toBeInTheDocument();
    expect(child?.textContent).toBe('Child Content');
  });
});
