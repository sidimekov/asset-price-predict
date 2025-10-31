import { render } from '@testing-library/react';
import Page from '@/app/page';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

describe('Home', () => {
  let spy: ReturnType<typeof vi.spyOn>;

  // подавляем возможные ворнинги jsdom
  beforeAll(() => {
    spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    spy.mockRestore();
  });

  it('renders without crash (smoke)', () => {
    const { container } = render(<Page />);

    // smoke: рендер не упал, контейнер есть
    expect(container).toBeTruthy();
    // не требуем конкретной разметки/текста — в jsdom страница может быть “пустой”
    expect(container instanceof HTMLElement).toBe(true);
  });
});
