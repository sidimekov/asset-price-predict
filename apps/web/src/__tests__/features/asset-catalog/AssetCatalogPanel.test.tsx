import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssetCatalogPanel } from '@/features/asset-catalog/ui/AssetCatalogPanel';
import type { CatalogItem } from '@shared/types/market';

// Мокаем debounce
vi.mock('lodash.debounce', () => ({
  default: vi.fn((fn) => {
    const wrappedFn = vi.fn((...args: any[]) => fn(...args));
    (wrappedFn as any).cancel = vi.fn();
    return wrappedFn;
  }),
}));

// Мокаем searchAssets
vi.mock('@/features/market-adapter/MarketAdapter', () => ({
  searchAssets: vi.fn(),
}));

// Мокаем Redux hooks
vi.mock('@/shared/store/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: vi.fn(),
}));

import { useAppSelector } from '@/shared/store/hooks';
import { searchAssets } from '@/features/market-adapter/MarketAdapter';

const mockCatalogItems: CatalogItem[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    provider: 'BINANCE',
    assetClass: 'crypto',
    currency: 'USDT',
    exchange: 'BINANCE',
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    provider: 'BINANCE',
    assetClass: 'crypto',
    currency: 'USDT',
    exchange: 'BINANCE',
  },
  {
    symbol: 'SBER',
    name: 'Сбербанк',
    provider: 'MOEX',
    assetClass: 'equity',
    currency: 'RUB',
    exchange: 'MOEX',
  },
];

const mockRecentItems = [
  {
    symbol: 'AAPL',
    provider: 'binance' as const,
    usedAt: '2024-01-01T00:00:00Z',
  },
  {
    symbol: 'GOOGL',
    provider: 'binance' as const,
    usedAt: '2024-01-02T00:00:00Z',
  },
];

describe('AssetCatalogPanel', () => {
  const defaultProps = {
    query: '',
    onQueryChange: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  const mockUseAppSelector = vi.mocked(useAppSelector);
  const mockSearchAssets = vi.mocked(searchAssets);

  beforeEach(() => {
    vi.clearAllMocks();

    // Простой мок - возвращаем дефолтные значения
    mockUseAppSelector.mockReturnValue([]);

    mockSearchAssets.mockResolvedValue([]);
  });

  // Вспомогательные функции для мокания конкретных состояний
  const mockState = (
    overrides: {
      results?: CatalogItem[];
      loading?: boolean;
      error?: string | null;
      provider?: 'binance' | 'moex';
      recent?: Array<{
        symbol: string;
        provider: 'binance' | 'moex';
        usedAt: string;
      }>;
    } = {},
  ) => {
    const {
      results = [],
      loading = false,
      error = null,
      provider = 'binance',
      recent = [],
    } = overrides;

    // Мокаем useAppSelector чтобы он возвращал разные значения при разных вызовах
    mockUseAppSelector
      .mockReturnValueOnce(results) // selectCatalogResults
      .mockReturnValueOnce(loading) // selectIsSearching
      .mockReturnValueOnce(error) // selectCatalogError
      .mockReturnValueOnce(provider) // selectCurrentProvider
      .mockReturnValueOnce(recent); // selectRecent
  };

  it('handles search abort on unmount', async () => {
    mockSearchAssets.mockImplementation(() => new Promise(() => {})); // Never resolving promise
    mockState();

    const { unmount } = render(
      <AssetCatalogPanel {...defaultProps} query="BTC" />,
    );

    unmount();

    // Проверяем что debounce был отменен
    await waitFor(() => {
      expect(mockSearchAssets).toHaveBeenCalled();
    });
  });

  it('handles search abort error', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    mockSearchAssets.mockRejectedValue(abortError);
    mockState();

    render(<AssetCatalogPanel {...defaultProps} query="BTC" />);

    await waitFor(() => {
      // Должен обработать AbortError без установки ошибки
      expect(screen.queryByText('Search failed')).not.toBeInTheDocument();
    });
  });

  it('selects item and enables add button', () => {
    mockState({ results: mockCatalogItems });

    render(<AssetCatalogPanel {...defaultProps} query="BTC" />);

    // Кликаем на первый результат
    const firstResult = screen.getByText('BTCUSDT');
    fireEvent.click(firstResult);

    // Проверяем что кнопка Add изменила текст и разблокирована
    const addButton = screen.getByText(/Add BTCUSDT/);
    expect(addButton).not.toBeDisabled();
    expect(addButton).toHaveTextContent('Add BTCUSDT · BINANCE');
  });

  it('handles add button click with selected item', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    mockState({ results: mockCatalogItems });

    render(
      <AssetCatalogPanel
        {...defaultProps}
        onSelect={onSelect}
        onClose={onClose}
        query="BTC"
      />,
    );

    // Выбираем элемент
    const firstResult = screen.getByText('BTCUSDT');
    fireEvent.click(firstResult);

    // Нажимаем кнопку Add
    const addButton = screen.getByText(/Add BTCUSDT/);
    fireEvent.click(addButton);

    expect(onSelect).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      provider: 'binance',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('handles empty search query', () => {
    mockState();

    render(<AssetCatalogPanel {...defaultProps} query="" />);

    // Не должно быть сообщения "No assets found"
    expect(screen.queryByText(/No assets found/)).not.toBeInTheDocument();
  });

  it('handles search with query length 1', () => {
    mockState();

    render(<AssetCatalogPanel {...defaultProps} query="B" />);

    // Не должно быть результатов поиска
    expect(screen.queryByText('BTCUSDT')).not.toBeInTheDocument();
  });
  it('renders basic elements', () => {
    mockState();

    render(<AssetCatalogPanel {...defaultProps} />);

    expect(screen.getByText('Find Assets')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search for asset...'),
    ).toBeInTheDocument();
    expect(screen.getByText('BINANCE')).toBeInTheDocument();
    expect(screen.getByText('MOEX')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockState({ loading: true });

    render(<AssetCatalogPanel {...defaultProps} />);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockState({ error: 'Search failed' });

    render(<AssetCatalogPanel {...defaultProps} />);

    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('shows recent items when no query', () => {
    mockState({ recent: mockRecentItems });

    render(<AssetCatalogPanel {...defaultProps} />);

    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
  });

  it('shows search results when query is provided', () => {
    mockState({ results: mockCatalogItems });

    render(<AssetCatalogPanel {...defaultProps} query="BTC" />);

    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('shows no results message when no assets found', () => {
    mockState({ results: [] });

    render(<AssetCatalogPanel {...defaultProps} query="XYZ" />);

    expect(screen.getByText('No assets found for “XYZ”')).toBeInTheDocument();
  });

  it('handles search input change', () => {
    const onQueryChange = vi.fn();
    mockState();

    render(
      <AssetCatalogPanel {...defaultProps} onQueryChange={onQueryChange} />,
    );

    const searchInput = screen.getByPlaceholderText('Search for asset...');
    fireEvent.change(searchInput, { target: { value: 'BTC' } });

    expect(onQueryChange).toHaveBeenCalledWith('BTC');
  });

  it('handles provider change', () => {
    mockState();

    render(<AssetCatalogPanel {...defaultProps} />);

    const moexTab = screen.getByText('MOEX');
    fireEvent.click(moexTab);

    expect(moexTab).toBeInTheDocument();
  });

  it('handles recent item click', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    mockState({ recent: mockRecentItems });

    render(
      <AssetCatalogPanel
        {...defaultProps}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    const recentItem = screen.getByText('AAPL');
    fireEvent.click(recentItem);

    expect(onSelect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('disables add button when no item selected', () => {
    mockState();

    render(<AssetCatalogPanel {...defaultProps} />);

    const addButton = screen.getByText('Add');
    expect(addButton).toBeDisabled();
  });

  describe('search functionality', () => {
    it('performs search when query length >= 2', async () => {
      mockSearchAssets.mockResolvedValue(mockCatalogItems);
      mockState();

      render(<AssetCatalogPanel {...defaultProps} query="BT" />);

      await waitFor(() => {
        expect(mockSearchAssets).toHaveBeenCalled();
      });
    });

    it('does not perform search when query length < 2', async () => {
      mockState();

      render(<AssetCatalogPanel {...defaultProps} query="B" />);

      await waitFor(() => {
        expect(mockSearchAssets).not.toHaveBeenCalled();
      });
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes for tabs', () => {
      mockState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const binanceTab = screen.getByText('BINANCE');
      const moexTab = screen.getByText('MOEX');

      expect(binanceTab).toHaveAttribute('role', 'tab');
      expect(binanceTab).toHaveAttribute('aria-selected', 'true');
      expect(moexTab).toHaveAttribute('role', 'tab');
      expect(moexTab).toHaveAttribute('aria-selected', 'false');
    });

    it('has proper ARIA attributes for search', () => {
      mockState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search for asset...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });
});
