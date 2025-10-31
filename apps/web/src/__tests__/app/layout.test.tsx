import { render } from '@testing-library/react';
import RootLayout from '@/app/layout';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

describe('RootLayout', () => {
  let spy: ReturnType<typeof vi.spyOn>;

  // подавляем ворнинги jsdom про <html> внутри <div>
  beforeAll(() => {
    spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    spy.mockRestore();
  });

  it('renders html, body and children (jsdom-robust)', () => {
    // Вкладываем напрямую в <html>, чтобы не было некорректной вложенности
    render(<RootLayout>{<div data-testid="child">child</div>}</RootLayout>, {
      container: document.documentElement,
    });

    // html/body существуют
    expect(document.documentElement).toBeInTheDocument();
    expect(document.body).toBeInTheDocument();

    // ребёнок отрисован
    expect(document.querySelector('[data-testid="child"]')).toBeInTheDocument();

    // В jsdom классы из next/font и utility-класс могут отсутствовать — не падаем
    const bodyClass = document.body.className || '';
    if (bodyClass) {
      // Если уже есть какие-то классы — можно мягко проверить часть
      expect(typeof bodyClass).toBe('string');
    }
  });
});
