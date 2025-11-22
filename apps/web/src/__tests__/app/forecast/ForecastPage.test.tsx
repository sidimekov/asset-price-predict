import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import ForecastPage from '@/app/forecast/[id]/page';

const pushMock = vi.fn();

vi.mock('next/navigation', () => {
  const query = {
    ticker: 'BTC',
    model: 'model-1',
    to: '2025-12-14',
  } as const;

  return {
    useRouter: () => ({
      push: pushMock,
    }),
    useParams: () => ({
      id: '0',
    }),
    useSearchParams: () =>
      ({
        get: (key: string) => query[key as keyof typeof query] ?? null,
      }) as any,
  };
});

// Мокаем ParamsPanel, чтобы удобно кликать по кнопке
vi.mock('@/features/params/ParamsPanel', () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <div>Parameters</div>
      <button onClick={props.onPredict}>Back to asset selection</button>
    </div>
  ),
}));

describe('ForecastPage', () => {
  it('renders forecast page with selected asset and panels', () => {
    const { container } = render(<ForecastPage />);

    expect(container.firstChild).toBeTruthy();
    expect(container.textContent).toContain('Selected asset');
    expect(container.textContent).toContain('Parameters');
    expect(container.textContent).toContain('Factors');
  });

  it('navigates back to dashboard when back button is clicked', () => {
    const { getByText } = render(<ForecastPage />);

    const backButton = getByText('Back to asset selection');
    fireEvent.click(backButton);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
