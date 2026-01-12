import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '@/app/dashboard/page';
import {
  selectRecent,
  selectSelectedAsset,
} from '@/features/asset-catalog/model/catalogSlice';

const pushMock = vi.fn();
const dispatchMock = vi.fn();
const useAppSelectorMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/shared/store/hooks', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: any) => useAppSelectorMock(selector),
}));

vi.mock('@/processes/orchestrator/useOrchestrator', () => ({
  useOrchestrator: () => undefined,
}));

vi.mock('@/widgets/recent-assets/RecentAssetsBar', () => ({
  default: ({ onAdd, onSelect }: any) => (
    <div>
      <button type="button" onClick={() => onAdd()}>
        open catalog
      </button>
      <button type="button" onClick={() => onSelect('BTC')}>
        select recent
      </button>
    </div>
  ),
}));

vi.mock('@/features/params/ParamsPanel', () => ({
  default: ({ onPredict, onModelChange, onDateChange }: any) => (
    <div>
      <button type="button" onClick={() => onModelChange('v1')}>
        set model
      </button>
      <button type="button" onClick={() => onDateChange('2025-01-01')}>
        set date
      </button>
      <button type="button" onClick={() => onPredict()}>
        predict
      </button>
    </div>
  ),
}));

vi.mock('@/features/factors/FactorsTable', () => ({
  default: () => <div>factors</div>,
}));

vi.mock('@/widgets/chart/CandlesChartPlaceholder', () => ({
  default: () => <div>chart</div>,
}));

vi.mock('@/widgets/chart/ForecastShapePlaceholder', () => ({
  default: () => <div>forecast-shape</div>,
}));

vi.mock('@/widgets/chart/coordinates/XAxis', () => ({
  default: () => <div>x</div>,
}));

vi.mock('@/widgets/chart/coordinates/YAxis', () => ({
  default: () => <div>y</div>,
}));

vi.mock('@/features/asset-catalog/ui/AssetCatalogPanel', () => ({
  AssetCatalogPanel: ({ onSelect }: any) => (
    <button type="button" onClick={() => onSelect({ symbol: 'ETH', provider: 'moex' })}>
      select asset
    </button>
  ),
}));

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not navigate when no selected asset', () => {
    useAppSelectorMock.mockImplementation((selector: any) => {
      if (selector === selectRecent) return [];
      if (selector === selectSelectedAsset) return null;
      return undefined;
    });

    render(<Dashboard />);

    fireEvent.click(screen.getByText('predict'));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('navigates with query when selected asset exists', () => {
    const recent = [{ symbol: 'BTC', provider: 'binance' }];
    const selected = { symbol: 'BTC', provider: 'binance' };
    useAppSelectorMock.mockImplementation((selector: any) => {
      if (selector === selectRecent) return recent;
      if (selector === selectSelectedAsset) return selected;
      return undefined;
    });

    render(<Dashboard />);

    fireEvent.click(screen.getByText('set model'));
    fireEvent.click(screen.getByText('set date'));
    fireEvent.click(screen.getByText('predict'));

    expect(pushMock).toHaveBeenCalledWith(
      '/forecast/0?ticker=BTC&model=v1&to=2025-01-01',
    );
  });

  it('handles catalog selection and dispatches actions', () => {
    useAppSelectorMock.mockImplementation((selector: any) => {
      if (selector === selectRecent) return [];
      if (selector === selectSelectedAsset)
        return { symbol: 'ETH', provider: 'moex' };
      return undefined;
    });

    render(<Dashboard />);

    fireEvent.click(screen.getByText('open catalog'));
    fireEvent.click(screen.getByText('select asset'));

    expect(dispatchMock).toHaveBeenCalled();
  });

  it('handles recent selection when recent list exists', () => {
    const recent = [{ symbol: 'BTC', provider: 'binance' }];
    const selected = { symbol: 'BTC', provider: 'binance' };
    useAppSelectorMock.mockImplementation((selector: any) => {
      if (selector === selectRecent) return recent;
      if (selector === selectSelectedAsset) return selected;
      return undefined;
    });

    render(<Dashboard />);

    fireEvent.click(screen.getByText('select recent'));

    expect(dispatchMock).toHaveBeenCalled();
  });
});
