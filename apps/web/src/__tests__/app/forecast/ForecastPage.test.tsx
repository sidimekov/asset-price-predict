import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForecastPage from '@/app/forecast/[id]/page';
import { selectSelectedAsset } from '@/features/asset-catalog/model/catalogSlice';
import { selectForecastParams } from '@/entities/forecast/model/selectors';

const pushMock = vi.fn();
const dispatchMock = vi.fn();
const useAppSelectorMock = vi.fn();

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

vi.mock('@/shared/store/hooks', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: any) => useAppSelectorMock(selector),
}));

vi.mock('@/processes/orchestrator/useOrchestrator', () => ({
  useOrchestrator: () => undefined,
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders forecast page with selected asset and panels', () => {
    useAppSelectorMock.mockImplementation((selector: any) => {
      if (selector === selectSelectedAsset)
        return { symbol: 'BTC', provider: 'binance' };
      if (selector === selectForecastParams)
        return { tf: '1h', window: 200, horizon: 24, model: null };
      return undefined;
    });

    const { container } = render(<ForecastPage />);

    expect(container.firstChild).toBeTruthy();
    expect(container.textContent).toContain('Selected asset');
    expect(container.textContent).toContain('Parameters');
  });

  it('navigates back to dashboard when back button is clicked', () => {
    useAppSelectorMock.mockImplementation((selector: any) => {
      if (selector === selectSelectedAsset)
        return { symbol: 'BTC', provider: 'binance' };
      if (selector === selectForecastParams)
        return { tf: '1h', window: 200, horizon: 24, model: null };
      return undefined;
    });

    const { getByText } = render(<ForecastPage />);

    const backButton = getByText('Back to asset selection');
    fireEvent.click(backButton);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
