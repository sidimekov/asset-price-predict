// __tests__/dashboard.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRouter } from 'next/navigation';
import Dashboard from '@/app/dashboard/page';
import catalogReducer from '@/features/asset-catalog/model/catalogSlice';
import { timeseriesReducer } from '@/entities/timeseries/model/timeseriesSlice';
import { forecastReducer } from '@/entities/forecast/model/forecastSlice';

// Определяем типы, так как они не экспортируются из слайсов
type ProviderType = 'binance' | 'moex' | 'mock';

interface RecentItem {
  symbol: string;
  provider: ProviderType;
  usedAt: string;
}

interface CatalogState {
  provider: ProviderType;
  query: string;
  results: any[];
  recent: RecentItem[];
  selected?: { symbol: string; provider: ProviderType };
  loading: boolean;
  error: string | null;
}

interface TimeseriesEntry {
  bars: any[];
  fetchedAt: string;
}

interface TimeseriesState {
  byKey: Record<string, TimeseriesEntry>;
  loadingByKey: Record<string, boolean>;
  errorByKey: Record<string, string | null>;
}

interface ForecastParams {
  tf: string;
  window: number | string;
  horizon: number;
  model: string;
}

interface ForecastState {
  params?: ForecastParams;
  predict: {
    requestId: number;
    request: any;
  };
  byKey: Record<string, any>;
  loadingByKey: Record<string, boolean>;
  errorByKey: Record<string, string | null>;
}

// Вспомогательная функция для создания store
const createTestStore = ({
  catalogState = {},
  timeseriesState = {},
  forecastState = {},
}: {
  catalogState?: Partial<CatalogState>;
  timeseriesState?: Partial<TimeseriesState>;
  forecastState?: Partial<ForecastState>;
} = {}) => {
  const fullCatalogState: CatalogState = {
    provider: 'binance',
    query: '',
    results: [],
    recent: [],
    selected: undefined,
    loading: false,
    error: null,
    ...catalogState,
  };

  const fullTimeseriesState: TimeseriesState = {
    byKey: {},
    loadingByKey: {},
    errorByKey: {},
    ...timeseriesState,
  };

  const fullForecastState: ForecastState = {
    params: undefined,
    predict: { requestId: 0, request: null },
    byKey: {},
    loadingByKey: {},
    errorByKey: {},
    ...forecastState,
  };

  const store = configureStore({
    reducer: {
      catalog: (state = fullCatalogState, action) => {
        // Используем реальный редьюсер с начальным состоянием
        return catalogReducer(state, action);
      },
      timeseries: (state = fullTimeseriesState, action) => {
        return timeseriesReducer(state, action);
      },
      forecast: (state = fullForecastState, action) => {
        return forecastReducer(state, action);
      },
    },
  });

  return store;
};

// Моки для внешних зависимостей
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/processes/orchestrator/useOrchestrator', () => ({
  useOrchestrator: vi.fn(),
}));

// Моки компонентов (остаются такими же, как в предыдущем примере)...

vi.mock('@/widgets/recent-assets/RecentAssetsBar', () => ({
  default: ({ assets, onSelect, onRemove, onAdd, selected, state }: any) => (
    <div data-testid="recent-assets-bar" data-state={state}>
      <button data-testid="open-catalog" onClick={onAdd}>
        Add Asset
      </button>
      {assets?.map((asset: any) => (
        <div
          key={`${asset.symbol}-${asset.provider}`}
          data-testid="recent-asset"
          data-selected={selected === asset.symbol}
        >
          <span data-testid="asset-symbol">{asset.symbol}</span>
          <button
            data-testid="select-asset-btn"
            onClick={() => onSelect(asset.symbol)}
          >
            Select
          </button>
          <button
            data-testid="remove-asset-btn"
            onClick={() => onRemove(asset.symbol, asset.provider)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/widgets/chart/CandlesChartPlaceholder', () => ({
  default: ({ state }: any) => (
    <div data-testid="chart-placeholder" data-state={state}>
      Chart Placeholder: {state}
    </div>
  ),
}));

vi.mock('@/widgets/chart/LineChart', () => ({
  default: ({ series, className }: any) => (
    <div data-testid="line-chart" className={className}>
      Line Chart with {series?.length || 0} data points
    </div>
  ),
}));

vi.mock('@/features/params/ParamsPanel', () => ({
  default: ({
    onPredict,
    selectedTimeframe,
    selectedWindow,
    selectedHorizon,
    selectedModel,
    onTimeframeChange,
    onWindowChange,
    onHorizonChange,
    onModelChange,
    state,
  }: any) => (
    <div data-testid="params-panel" data-state={state}>
      <button data-testid="predict-button" onClick={onPredict}>
        Predict
      </button>
      <select
        data-testid="timeframe-select"
        value={selectedTimeframe}
        onChange={(e) => onTimeframeChange(e.target.value)}
      >
        <option value="1h">1h</option>
        <option value="4h">4h</option>
        <option value="1d">1d</option>
      </select>
      <input
        data-testid="window-input"
        type="number"
        value={selectedWindow}
        onChange={(e) => onWindowChange(Number(e.target.value))}
      />
      <input
        data-testid="horizon-input"
        type="number"
        value={selectedHorizon}
        onChange={(e) => onHorizonChange(Number(e.target.value))}
      />
      <select
        data-testid="model-select"
        value={selectedModel || ''}
        onChange={(e) => onModelChange(e.target.value)}
      >
        <option value="minimal">Minimal</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>
  ),
}));

vi.mock('@/widgets/chart/coordinates/XAxis', () => ({
  default: ({ timestamps, className }: any) => (
    <div data-testid="x-axis" className={className}>
      X Axis with {timestamps?.length || 0} timestamps
    </div>
  ),
}));

vi.mock('@/widgets/chart/coordinates/YAxis', () => ({
  default: ({ values, className }: any) => (
    <div data-testid="y-axis" className={className}>
      Y Axis with {values?.length || 0} values
    </div>
  ),
}));

vi.mock('@/features/asset-catalog/ui/AssetCatalogPanel', () => ({
  AssetCatalogPanel: ({ query, onQueryChange, onSelect, onClose }: any) => (
    <div data-testid="asset-catalog">
      <input
        data-testid="catalog-search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search assets..."
      />
      <button
        data-testid="select-btc"
        onClick={() => onSelect({ symbol: 'BTCUSDT', provider: 'binance' })}
      >
        Select BTC/USDT
      </button>
      <button
        data-testid="select-sber"
        onClick={() => onSelect({ symbol: 'SBER', provider: 'moex' })}
      >
        Select SBER
      </button>
      <button data-testid="close-catalog" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe('Dashboard Component', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);

    // Мок для localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  afterEach(() => {
    cleanup();
  });

  const renderDashboard = (options?: {
    catalogState?: Partial<CatalogState>;
    timeseriesState?: Partial<TimeseriesState>;
    forecastState?: Partial<ForecastState>;
  }) => {
    const store = createTestStore(options);

    return render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );
  };

  describe('Initial rendering', () => {
    it('should render the dashboard without errors', () => {
      renderDashboard();

      expect(screen.getByTestId('recent-assets-bar')).toBeInTheDocument();
      expect(screen.getByTestId('params-panel')).toBeInTheDocument();
    });

    it('should show empty state when no assets are selected', () => {
      renderDashboard();

      const chartPlaceholder = screen.getByTestId('chart-placeholder');
      expect(chartPlaceholder).toHaveAttribute('data-state', 'empty');
    });

    it('should initialize with default forecast parameters', () => {
      renderDashboard();

      expect(screen.getByTestId('window-input')).toHaveValue(200);
      expect(screen.getByTestId('horizon-input')).toHaveValue(24);
      expect(screen.getByTestId('timeframe-select')).toHaveValue('1h');
    });
  });

  describe('Recent assets functionality', () => {
    it('should display recent assets with statistics', () => {
      renderDashboard({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
            {
              symbol: 'SBER',
              provider: 'moex',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
      });

      const recentAssets = screen.getAllByTestId('recent-asset');
      expect(recentAssets).toHaveLength(2);
    });

    it('should highlight selected asset', () => {
      renderDashboard({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
            {
              symbol: 'SBER',
              provider: 'moex',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
      });

      const recentAssets = screen.getAllByTestId('recent-asset');
      expect(recentAssets[0]).toHaveAttribute('data-selected', 'true');
      expect(recentAssets[1]).toHaveAttribute('data-selected', 'false');
    });
  });

  describe('Asset catalog modal', () => {
    it('should open catalog modal when add button is clicked', async () => {
      renderDashboard();

      const addButton = screen.getByTestId('open-catalog');
      await userEvent.click(addButton);

      expect(screen.getByTestId('asset-catalog')).toBeInTheDocument();
      expect(screen.getByTestId('catalog-search')).toBeInTheDocument();
    });

    it('should close catalog modal when close button is clicked', async () => {
      renderDashboard();

      // Open catalog
      await userEvent.click(screen.getByTestId('open-catalog'));
      expect(screen.getByTestId('asset-catalog')).toBeInTheDocument();

      // Close catalog
      await userEvent.click(screen.getByTestId('close-catalog'));

      await waitFor(() => {
        expect(screen.queryByTestId('asset-catalog')).not.toBeInTheDocument();
      });
    });

    it('should update search query in catalog', async () => {
      renderDashboard();

      // Open catalog
      await userEvent.click(screen.getByTestId('open-catalog'));

      const searchInput = screen.getByTestId('catalog-search');
      await userEvent.type(searchInput, 'BTC');

      expect(searchInput).toHaveValue('BTC');
    });

    it('should select asset from catalog and close modal', async () => {
      const store = createTestStore();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>,
      );

      // Open catalog
      await userEvent.click(screen.getByTestId('open-catalog'));

      // Select asset
      await userEvent.click(screen.getByTestId('select-btc'));

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByTestId('asset-catalog')).not.toBeInTheDocument();
      });

      // Should dispatch addRecent and setSelected actions
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  describe('Chart display states', () => {
    it('should show loading state when data is loading', () => {
      renderDashboard({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
        timeseriesState: {
          loadingByKey: { 'BINANCE:BTCUSDT:1h:200': true },
        },
      });

      const chartPlaceholder = screen.getByTestId('chart-placeholder');
      expect(chartPlaceholder).toHaveAttribute('data-state', 'loading');
    });

    it('should show line chart when data is available', () => {
      renderDashboard({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
        timeseriesState: {
          byKey: {
            'BINANCE:BTCUSDT:1h:200': {
              bars: [
                [1640995200000, 100, 110, 95, 105],
                [1641002400000, 105, 115, 100, 110],
                [1641009600000, 110, 120, 105, 115],
              ],
              fetchedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        },
      });

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });
  });

  describe('Forecast parameters', () => {
    it('should update timeframe parameter', async () => {
      const store = createTestStore({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>,
      );

      const timeframeSelect = screen.getByTestId('timeframe-select');
      await userEvent.selectOptions(timeframeSelect, '4h');

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'forecast/setForecastParams',
        }),
      );
    });

    it('should update window parameter', async () => {
      const store = createTestStore({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>,
      );

      const windowInput = screen.getByTestId('window-input');
      await userEvent.clear(windowInput);
      await userEvent.type(windowInput, '100');

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'forecast/setForecastParams',
        }),
      );
    });

    it('should update horizon parameter', async () => {
      const store = createTestStore({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>,
      );

      const horizonInput = screen.getByTestId('horizon-input');
      await userEvent.clear(horizonInput);
      await userEvent.type(horizonInput, '48');

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'forecast/setForecastParams',
        }),
      );
    });

    it('should update model parameter', async () => {
      const store = createTestStore({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>,
      );

      const modelSelect = screen.getByTestId('model-select');
      await userEvent.selectOptions(modelSelect, 'advanced');

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'forecast/setForecastParams',
        }),
      );
    });
  });

  describe('Predict functionality', () => {
    it('should navigate to forecast page on predict button click', async () => {
      renderDashboard({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
        timeseriesState: {
          byKey: {
            'BINANCE:BTCUSDT:1h:200': {
              bars: [[1640995200000, 100, 110, 95, 105]],
              fetchedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        },
      });

      const predictButton = screen.getByTestId('predict-button');
      await userEvent.click(predictButton);

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/forecast/BTCUSDT'),
      );
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('provider=binance'),
      );
    });

    it('should not navigate when no asset is selected', async () => {
      renderDashboard();

      const predictButton = screen.getByTestId('predict-button');
      await userEvent.click(predictButton);

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Asset management', () => {
    it('should remove asset from recent list', async () => {
      const store = createTestStore({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
            {
              symbol: 'SBER',
              provider: 'moex',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: { tf: '1h', window: 200, horizon: 24, model: 'minimal' },
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>,
      );

      const removeButtons = screen.getAllByTestId('remove-asset-btn');
      await userEvent.click(removeButtons[0]); // Remove BTCUSDT

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'catalog/removeRecent',
          payload: { symbol: 'BTCUSDT', provider: 'binance' },
        }),
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty recent assets state', () => {
      renderDashboard({
        catalogState: {
          recent: [],
        },
      });

      const recentAssetsBar = screen.getByTestId('recent-assets-bar');
      expect(recentAssetsBar).toHaveAttribute('data-state', 'empty');
    });

    it('should handle missing forecast parameters', () => {
      renderDashboard({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: undefined,
        },
      });

      // Should still render with default parameters
      expect(screen.getByTestId('window-input')).toHaveValue(200);
    });

    it('should handle window parameter as string', () => {
      renderDashboard({
        catalogState: {
          recent: [
            {
              symbol: 'BTCUSDT',
              provider: 'binance',
              usedAt: new Date().toISOString(),
            },
          ],
          selected: { symbol: 'BTCUSDT', provider: 'binance' },
        },
        forecastState: {
          params: {
            tf: '1h',
            window: '200' as any,
            horizon: 24,
            model: 'minimal',
          },
        },
      });

      // Should handle string window parameter
      expect(screen.getByTestId('window-input')).toHaveValue(200);
    });
  });
});
