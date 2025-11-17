import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ForecastPage from '@/app/forecast/[id]/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    id: '0',
  }),
  useSearchParams: () =>
      new URLSearchParams('ticker=BTC&model=model-1&to=2025-12-14'),
}));

describe('ForecastPage (smoke test)', () => {
  it('renders forecast page with selected asset and panels', () => {
    const { container } = render(<ForecastPage />);

    // базовые куски UI
    expect(container.textContent).toContain('Selected asset');
    expect(container.textContent).toContain('Parameters');
    expect(container.textContent).toContain('Factors');

    // проверяем наличие текста кнопки через textContent
    expect(container.textContent).toContain('Back to asset selection');
  });
});