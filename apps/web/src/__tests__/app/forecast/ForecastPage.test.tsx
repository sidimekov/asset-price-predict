import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ForecastPage from '@/app/forecast/[id]/page';

vi.mock('next/navigation', () => {
  const push = vi.fn();

  return {
    useRouter: () => ({ push }),
    useParams: () => ({ id: '0' }),
    useSearchParams: () => ({
      get: (key: string) => {
        const map: Record<string, string> = {
          ticker: 'ASSET0',
          model: 'model-1',
          to: '2025-12-14',
        };
        return map[key] ?? null;
      },
    }),
  };
});

describe('ForecastPage (smoke test)', () => {
  it('renders forecast page with selected asset and panels', () => {
    const { container, getByText } = render(<ForecastPage />);

    expect(getByText('Selected asset:')).toBeInTheDocument();

    expect(container.textContent).toContain('Parameters');
    expect(container.textContent).toContain('Factors');

    expect(getByText('Back to asset selection')).toBeInTheDocument();
  });
});