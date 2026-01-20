// apps/web/src/app/dashboard/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from '@/app/dashboard/page';
import type { RootState } from '@/shared/store/index';

// Мокаем хуки и компоненты
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('@/shared/api/account.api', () => ({
  useGetMeQuery: () => ({
    data: {
      id: '1',
      username: 'John Doe',
      email: 'john@example.com',
      avatarUrl: '/avatar.jpg',
    },
  }),
}));

vi.mock('@/widgets/chart/CandlesChartPlaceholder', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/params/ParamsPanel', () => ({
  default: vi.fn(),
}));

vi.mock('@/widgets/chart/coordinates/XAxis', () => ({
  default: vi.fn(),
}));

vi.mock('@/widgets/chart/coordinates/YAxis', () => ({
  default: vi.fn(),
}));

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
    localStorage.setItem('auth.token', 'test-token');
  });

vi.mock('@/shared/store/hooks', () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));

vi.mock('@/processes/orchestrator/useOrchestrator', () => ({
  useOrchestrator: vi.fn(),
}));

// Импортируем мокированные функции
import { useRouter } from 'next/navigation';
import RecentAssetsBar from '@/widgets/recent-assets/RecentAssetsBar';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import ParamsPanel from '@/features/params/ParamsPanel';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import { AssetCatalogPanel } from '@/features/asset-catalog/ui/AssetCatalogPanel';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';

// Типы для селекторов
type SelectorFunction = (state: RootState) => any;

// Создаем моки с типами
const mockUseRouter = useRouter as Mock;
const MockRecentAssetsBar = RecentAssetsBar as Mock;
const MockCandlesChartPlaceholder = CandlesChartPlaceholder as Mock;
const MockParamsPanel = ParamsPanel as Mock;
const MockXAxis = XAxis as Mock;
const MockYAxis = YAxis as Mock;
const MockAssetCatalogPanel = AssetCatalogPanel as Mock;
const mockUseAppDispatch = useAppDispatch as Mock;
const mockUseAppSelector = useAppSelector as Mock;
const mockUseOrchestrator = useOrchestrator as Mock;

describe('Dashboard', () => {
  const mockPush = vi.fn();
  const mockDispatch = vi.fn();

  // Создаем типизированные селекторы
  const mockSelectors = {
    selectRecent: vi.fn(),
    selectSelectedAsset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Настраиваем моки
    mockUseRouter.mockReturnValue({ push: mockPush });
    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockUseOrchestrator.mockImplementation(() => {});

    // Сбрасываем селекторы к значениям по умолчанию
    mockSelectors.selectRecent.mockReturnValue([]);
    mockSelectors.selectSelectedAsset.mockReturnValue(null);

    // Настраиваем useAppSelector чтобы он использовал наши мокированные селекторы
    mockUseAppSelector.mockImplementation((selector: SelectorFunction) => {
      // Проверяем имя функции селектора
      const selectorName = selector.name || '';

      if (selectorName.includes('selectRecent')) {
        return mockSelectors.selectRecent();
      }
      if (selectorName.includes('selectSelectedAsset')) {
        return mockSelectors.selectSelectedAsset();
      }
      return undefined;
    });

    // Мокируем компоненты
    MockRecentAssetsBar.mockImplementation(
      ({ state, assets, selected, onSelect, onRemove, onAdd }: any) => (
        <div data-testid="recent-assets-bar">
          <div data-testid="recent-assets-state">{state}</div>
          <div data-testid="recent-assets-count">{(assets || []).length}</div>
          <button data-testid="add-asset-button" onClick={onAdd || (() => {})}>
            Add Asset
          </button>
          {(assets || []).map((asset: any, index: number) => (
            <div key={index} data-testid={`asset-${asset.symbol}`}>
              <span data-testid={`asset-symbol-${asset.symbol}`}>
                {asset.symbol}
              </span>
              <button
                data-testid={`select-${asset.symbol}`}
                onClick={() => onSelect?.(asset.symbol)}
              >
                Select
              </button>
              <button
                data-testid={`remove-${asset.symbol}`}
                onClick={() => onRemove?.(asset.symbol)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ),
    );

    MockCandlesChartPlaceholder.mockImplementation(({ state }: any) => (
      <div data-testid="chart-placeholder" data-state={state}>
        Candles Chart Placeholder
      </div>
    ));

    MockParamsPanel.mockImplementation(
      ({
        state,
        onPredict,
        selectedModel,
        selectedDate,
        onModelChange,
        onDateChange,
      }: any) => (
        <div data-testid="params-panel">
          <div data-testid="params-state">{state}</div>
          <button
            data-testid="predict-button"
            onClick={onPredict || (() => {})}
          >
            Predict
          </button>
          <select
            data-testid="model-select"
            value={selectedModel || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onModelChange?.(e.target.value)
            }
          >
            <option value="">Select Model</option>
            <option value="model1">Model 1</option>
          </select>
          <input
            data-testid="date-input"
            type="date"
            value={selectedDate || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onDateChange?.(e.target.value)
            }
          />
        </div>
      ),
    );

    MockXAxis.mockImplementation(({ className }: any) => (
      <div data-testid="x-axis" className={className}>
        X Axis
      </div>
    ));

    MockYAxis.mockImplementation(({ className }: any) => (
      <div data-testid="y-axis" className={className}>
        Y Axis
      </div>
    ));

    MockAssetCatalogPanel.mockImplementation(
      ({ query, onQueryChange, onSelect, onClose }: any) => (
        <div data-testid="asset-catalog-panel">
          <input
            data-testid="catalog-search"
            value={query || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onQueryChange?.(e.target.value)
            }
          />
          <button
            data-testid="select-asset-btc"
            onClick={() =>
              onSelect?.({ symbol: 'BTCUSDT', provider: 'binance' })
            }
          >
            Select BTC
          </button>
          <button
            data-testid="select-asset-eth"
            onClick={() =>
              onSelect?.({ symbol: 'ETHUSDT', provider: 'binance' })
            }
          >
            Select ETH
          </button>
          <button data-testid="close-catalog" onClick={onClose || (() => {})}>
            Close
          </button>
        </div>
      ),
    );
  });

  const createMockStore = (state = {}) => {
    return configureStore({
      reducer: {
        catalog: (state = {}, action) => state,
      },
      preloadedState: state,
    });
  };

  const renderWithProvider = (storeState = {}) => {
    const store = createMockStore(storeState);
    return render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );
  };

  describe('Initial Render', () => {
    it('renders dashboard with correct layout', () => {
      renderWithProvider();

      expect(screen.getByTestId('recent-assets-bar')).toBeInTheDocument();
      expect(screen.getByTestId('chart-placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('params-panel')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();

      expect(screen.getByTestId('recent-assets-state')).toHaveTextContent(
        'empty',
      );
      expect(screen.getByTestId('recent-assets-count')).toHaveTextContent('0');
      expect(screen.getByTestId('params-state')).toHaveTextContent('idle');
    });

    it('has correct grid layout classes', () => {
      const { container } = renderWithProvider();

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-12');
      expect(grid).toHaveClass('gap-6');
    });
  });

  describe('Recent Assets Functionality', () => {
    it('shows empty state when no assets selected', () => {
      // Уже установлены значения по умолчанию: [] и null
      renderWithProvider();

      expect(screen.getByTestId('recent-assets-state')).toHaveTextContent(
        'empty',
      );
      expect(screen.getByTestId('recent-assets-count')).toHaveTextContent('0');
      expect(screen.getByTestId('chart-placeholder')).toHaveAttribute(
        'data-state',
        'empty',
      );
    });

    it('shows ready state when assets exist and one is selected', () => {
      mockSelectors.selectRecent.mockReturnValue([
        { symbol: 'BTCUSDT', provider: 'binance' },
        { symbol: 'ETHUSDT', provider: 'binance' },
      ]);
      mockSelectors.selectSelectedAsset.mockReturnValue({
        symbol: 'BTCUSDT',
        provider: 'binance',
      });

      renderWithProvider();

      expect(screen.getByTestId('recent-assets-state')).toHaveTextContent(
        'ready',
      );
      expect(screen.getByTestId('recent-assets-count')).toHaveTextContent('2');
      expect(screen.getByTestId('chart-placeholder')).toHaveAttribute(
        'data-state',
        'ready',
      );
    });

    it('handles adding assets via catalog', () => {
      renderWithProvider();

      fireEvent.click(screen.getByTestId('add-asset-button'));
      expect(screen.getByTestId('asset-catalog-panel')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('select-asset-btc'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'catalog/addRecent',
        payload: { symbol: 'BTCUSDT', provider: 'binance' },
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'catalog/setSelected',
        payload: { symbol: 'BTCUSDT', provider: 'binance' },
      });
    });

    it('handles removing assets', () => {
      mockSelectors.selectRecent.mockReturnValue([
        { symbol: 'BTCUSDT', provider: 'binance' },
        { symbol: 'ETHUSDT', provider: 'binance' },
      ]);
      mockSelectors.selectSelectedAsset.mockReturnValue({
        symbol: 'BTCUSDT',
        provider: 'binance',
      });

      renderWithProvider();

      fireEvent.click(screen.getByTestId('remove-BTCUSDT'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'catalog/removeRecent',
        payload: { symbol: 'BTCUSDT', provider: 'binance' },
      });
    });

    it('handles selecting recent assets', () => {
      mockSelectors.selectRecent.mockReturnValue([
        { symbol: 'BTCUSDT', provider: 'binance' },
        { symbol: 'ETHUSDT', provider: 'binance' },
      ]);
      mockSelectors.selectSelectedAsset.mockReturnValue({
        symbol: 'BTCUSDT',
        provider: 'binance',
      });

      renderWithProvider();

      fireEvent.click(screen.getByTestId('select-ETHUSDT'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'catalog/setSelected',
        payload: { symbol: 'ETHUSDT', provider: 'binance' },
      });
    });
  });

  describe('Catalog Modal', () => {
    it('opens and closes catalog modal', () => {
      renderWithProvider();

      expect(
        screen.queryByTestId('asset-catalog-panel'),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('add-asset-button'));
      expect(screen.getByTestId('asset-catalog-panel')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-catalog'));
      expect(
        screen.queryByTestId('asset-catalog-panel'),
      ).not.toBeInTheDocument();
    });

    it('closes catalog when clicking overlay', () => {
      renderWithProvider();

      fireEvent.click(screen.getByTestId('add-asset-button'));
      expect(screen.getByTestId('asset-catalog-panel')).toBeInTheDocument();

      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay!);

      expect(
        screen.queryByTestId('asset-catalog-panel'),
      ).not.toBeInTheDocument();
    });

    it('updates search query in catalog', () => {
      renderWithProvider();

      fireEvent.click(screen.getByTestId('add-asset-button'));

      const searchInput = screen.getByTestId('catalog-search');
      fireEvent.change(searchInput, { target: { value: 'BTC' } });

      expect(searchInput).toHaveValue('BTC');
    });
  });

  describe('Prediction Functionality', () => {
    it('disables predict when no asset selected', () => {
      renderWithProvider();

      fireEvent.click(screen.getByTestId('predict-button'));

      expect(mockPush).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('handles predict with selected asset', () => {
      mockSelectors.selectRecent.mockReturnValue([
        { symbol: 'BTCUSDT', provider: 'binance' },
      ]);
      mockSelectors.selectSelectedAsset.mockReturnValue({
        symbol: 'BTCUSDT',
        provider: 'binance',
      });

      renderWithProvider();

      fireEvent.change(screen.getByTestId('model-select'), {
        target: { value: 'model1' },
      });
      fireEvent.change(screen.getByTestId('date-input'), {
        target: { value: '2024-01-01' },
      });

      fireEvent.click(screen.getByTestId('predict-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'forecast/predictRequested',
        payload: {
          symbol: 'BTCUSDT',
          provider: 'binance',
          tf: '1h',
          window: 200,
          horizon: 24,
          model: 'model1',
        },
      });

      expect(mockPush).toHaveBeenCalledWith(
        '/forecast/0?ticker=BTCUSDT&model=model1&to=2024-01-01',
      );
    });
  });

  describe('Params Panel Integration', () => {
    it('updates selected model', () => {
      renderWithProvider();

      const modelSelect = screen.getByTestId('model-select');
      fireEvent.change(modelSelect, { target: { value: 'model1' } });

      expect(modelSelect).toHaveValue('model1');
    });

    it('updates selected date', () => {
      renderWithProvider();

      const dateInput = screen.getByTestId('date-input');
      const newDate = '2024-12-31';
      fireEvent.change(dateInput, { target: { value: newDate } });

      expect(dateInput).toHaveValue(newDate);
    });

    it('shows loading state transition', async () => {
      renderWithProvider();

      expect(screen.getByTestId('params-state')).toHaveTextContent('idle');

      await waitFor(
        () => {
          expect(screen.getByTestId('params-state')).toHaveTextContent(
            'success',
          );
        },
        { timeout: 2000 },
      );
    });
  });

  describe('UseEffect and Hooks', () => {
    it('calls useOrchestrator hook', () => {
      renderWithProvider();
      expect(mockUseOrchestrator).toHaveBeenCalledTimes(1);
    });

    it('sets default date to today', () => {
      const today = new Date();
      const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      renderWithProvider();

      const dateInput = screen.getByTestId('date-input');
      expect(dateInput).toHaveValue(expectedDate);
    });

    it('cleans up timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = renderWithProvider();
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Accessibility and Styling', () => {
    it('has correct background and styling', () => {
      const { container } = renderWithProvider();

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('bg-primary');
    });

    it('close button has proper aria label', () => {
      renderWithProvider();

      fireEvent.click(screen.getByTestId('add-asset-button'));

      const closeButton = document.querySelector('.find-assets-close-button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });
  });

  describe('Error Handling', () => {
    it('handles null asset gracefully', () => {
      mockSelectors.selectSelectedAsset.mockReturnValue(undefined);

      expect(() => {
        renderWithProvider();
      }).not.toThrow();

      expect(screen.getByTestId('recent-assets-state')).toHaveTextContent(
        'empty',
      );
    });

    it('handles empty recent assets with selected asset', () => {
      mockSelectors.selectRecent.mockReturnValue([]);
      mockSelectors.selectSelectedAsset.mockReturnValue({
        symbol: 'BTCUSDT',
        provider: 'binance',
      });

      renderWithProvider();

      expect(screen.getByTestId('recent-assets-state')).toHaveTextContent(
        'empty',
      );
    });
  });
});
