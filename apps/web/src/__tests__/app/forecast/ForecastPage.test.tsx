import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ForecastPage from '@/app/forecast/[id]/page';

vi.mock('next/navigation', () => {
  const query = {
    ticker: 'BTC',
    model: 'model-1',
    to: '2025-12-14',
  } as const;

  return {
    useRouter: () => ({
      push: vi.fn(),
    }),
    useParams: () => ({
      id: '0',
    }),
    useSearchParams: () =>
        ({
          get: (key: string) => query[key as keyof typeof query] ?? null,
        } as any),
  };
});

describe('ForecastPage (smoke test)', () => {
  it('renders forecast page with selected asset and panels', () => {
    const { container } = render(<ForecastPage />);

    // Страница вообще рендерится
    expect(container.firstChild).toBeTruthy();

    // Есть ключевые элементы интерфейса
    expect(container.textContent).toContain('Selected asset');
    expect(container.textContent).toContain('Parameters');
    expect(container.textContent).toContain('Factors');
  });
});