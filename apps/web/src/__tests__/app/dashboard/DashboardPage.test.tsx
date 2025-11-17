import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/shared/store';
import Dashboard from '@/app/dashboard/page';

// Правильный мок для JSON файла - с default
vi.mock('@/mocks/recentAssets.json', () => ({
  default: [
    { symbol: 'BTCUSDT', price: '50000', provider: 'binance' },
    { symbol: 'SBER', price: '300', provider: 'moex' },
  ],
}));

// Мокаем child компоненты чтобы избежать сложных зависимостей
vi.mock('@/widgets/recent-assets/RecentAssetsBar', () => ({
  default: ({ state, assets, selected, onSelect, onRemove, onAdd }: any) => (
    <div data-testid="recent-assets-bar">
      <div>Recent Assets</div>
      <div>State: {state}</div>
      <div>Assets count: {assets.length}</div>
      <div>Selected: {selected}</div>
      <button onClick={() => onSelect('TEST')}>Select Asset</button>
      <button onClick={() => onRemove('BTCUSDT')}>Remove Asset</button>
      <button onClick={onAdd}>Add Asset</button>
    </div>
  ),
}));

vi.mock('@/widgets/chart/CandlesChartPlaceholder', () => ({
  default: ({ state }: any) => (
    <div data-testid="chart">Chart State: {state}</div>
  ),
}));

vi.mock('@/widgets/chart/coordinates/XAxis', () => ({
  default: ({ className }: any) => <div className={className}>XAxis</div>,
}));

vi.mock('@/widgets/chart/coordinates/YAxis', () => ({
  default: ({ className }: any) => <div className={className}>YAxis</div>,
}));

vi.mock('@/features/params/ParamsPanel', () => ({
  default: ({ state }: any) => (
    <div data-testid="params-panel">Parameters State: {state}</div>
  ),
}));

vi.mock('@/features/factors/FactorsTable', () => ({
  default: ({ state }: any) => (
    <div data-testid="factors-table">Factors State: {state}</div>
  ),
}));

vi.mock('@/features/asset-catalog/ui/AssetCatalogPanel', () => ({
  AssetCatalogPanel: ({ query, onQueryChange, onSelect, onClose }: any) => (
    <div data-testid="asset-catalog">
      <div>Find Assets</div>
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search for asset..."
        data-testid="search-input"
      />
      <button
        onClick={() => onSelect({ symbol: 'ETHUSDT', provider: 'binance' })}
      >
        Select ETH
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing and shows all sections', () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(container.firstChild).toBeTruthy();
    expect(screen.getByText('Recent Assets')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(screen.getByTestId('params-panel')).toBeInTheDocument();
    expect(screen.getByTestId('factors-table')).toBeInTheDocument();
  });

  it('shows loading states initially', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Проверяем начальное состояние загрузки
    expect(screen.getByText('State: loading')).toBeInTheDocument();
    expect(screen.getByText('Parameters State: loading')).toBeInTheDocument();
    expect(screen.getByText('Factors State: loading')).toBeInTheDocument();
  });

  it('handles asset selection from catalog modal', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Открываем модалку
    fireEvent.click(screen.getByText('Add Asset'));

    expect(screen.getByTestId('asset-catalog')).toBeInTheDocument();
    expect(screen.getByText('Find Assets')).toBeInTheDocument();

    // Выбираем актив
    fireEvent.click(screen.getByText('Select ETH'));

    // Модалка должна закрыться
    expect(screen.queryByTestId('asset-catalog')).not.toBeInTheDocument();
  });

  it('handles asset removal', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Удаляем актив
    fireEvent.click(screen.getByText('Remove Asset'));

    // Проверяем что компонент не падает
    expect(screen.getByTestId('recent-assets-bar')).toBeInTheDocument();
  });

  it('handles asset selection from recent bar', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Выбираем актив из recent bar
    fireEvent.click(screen.getByText('Select Asset'));

    // Проверяем что компонент обрабатывает выбор
    expect(screen.getByTestId('recent-assets-bar')).toBeInTheDocument();
  });

  it('closes catalog modal when close button is clicked', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Открываем модалку
    fireEvent.click(screen.getByText('Add Asset'));
    expect(screen.getByTestId('asset-catalog')).toBeInTheDocument();

    // Закрываем модалку
    fireEvent.click(screen.getByText('Close'));

    // Модалка должна закрыться
    expect(screen.queryByTestId('asset-catalog')).not.toBeInTheDocument();
  });

  it('handles query change in catalog modal', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Открываем модалку
    fireEvent.click(screen.getByText('Add Asset'));

    // Меняем query
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'BTC' } });

    expect(searchInput).toHaveValue('BTC');
  });

  it('handles modal backdrop click', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Открываем модалку
    fireEvent.click(screen.getByText('Add Asset'));
    expect(screen.getByTestId('asset-catalog')).toBeInTheDocument();

    // Находим бэкдроп (первый элемент с fixed позицией)
    const backdrop = document.querySelector('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    // Модалка должна остаться открытой (по логике кода)
    expect(screen.getByTestId('asset-catalog')).toBeInTheDocument();
  });
});
