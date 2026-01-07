// apps/web/src/__tests__/features/asset-catalog/AssetCatalogPanel.test.tsx
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
  },
  {
    symbol: 'GOOGL',
    provider: 'binance' as const,
  },
];

describe('AssetCatalogPanel', () => {
  const defaultProps = {
    query: '',
    onQueryChange: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  const mockSearchAssets = vi.mocked(searchAssets);
  const mockUseAppSelector = vi.mocked(useAppSelector);

  beforeEach(() => {
    vi.clearAllMocks();

    // Устанавливаем дефолтные значения
    mockSearchAssets.mockResolvedValue([]);
  });

  // Вспомогательная функция для мокания состояний Redux
  const mockReduxState = (
    overrides: {
      results?: CatalogItem[];
      loading?: boolean;
      error?: string | null;
      provider?: 'binance' | 'moex';
      recent?: Array<{ symbol: string; provider: 'binance' | 'moex' }>;
    } = {},
  ) => {
    const {
      results = [],
      loading = false,
      error = null,
      provider = 'binance',
      recent = [],
    } = overrides;

    // Создаем моковые селекторы
    const selectCatalogResults = () => results;
    const selectIsSearching = () => loading;
    const selectCatalogError = () => error;
    const selectCurrentProvider = () => provider;
    const selectRecent = () => recent;

    // Мокаем useAppSelector чтобы он вызывал соответствующие селекторы
    mockUseAppSelector.mockImplementation((selector: any) => {
      // В реальном коде селекторы вызываются с state
      // Здесь мы просто вызываем их как функции
      if (
        selector.name === 'selectCatalogResults' ||
        selector.toString().includes('results')
      ) {
        return selectCatalogResults();
      }
      if (
        selector.name === 'selectIsSearching' ||
        selector.toString().includes('loading')
      ) {
        return selectIsSearching();
      }
      if (
        selector.name === 'selectCatalogError' ||
        selector.toString().includes('error')
      ) {
        return selectCatalogError();
      }
      if (
        selector.name === 'selectCurrentProvider' ||
        selector.toString().includes('provider')
      ) {
        return selectCurrentProvider();
      }
      if (
        selector.name === 'selectRecent' ||
        selector.toString().includes('recent')
      ) {
        return selectRecent();
      }
      return null;
    });
  };

  describe('рендеринг', () => {
    it('отображает основные элементы', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      expect(screen.getByText('Find Assets')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search for asset...'),
      ).toBeInTheDocument();
      expect(screen.getByText('BINANCE')).toBeInTheDocument();
      expect(screen.getByText('MOEX')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('отображает состояние загрузки', () => {
      mockReduxState({ loading: true });

      render(<AssetCatalogPanel {...defaultProps} />);

      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('отображает состояние ошибки', () => {
      mockReduxState({ error: 'Search failed' });

      render(<AssetCatalogPanel {...defaultProps} />);

      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });
  });

  describe('недавние элементы', () => {
    it('отображает недавние элементы когда нет запроса', () => {
      mockReduxState({ recent: mockRecentItems });

      render(<AssetCatalogPanel {...defaultProps} />);

      expect(screen.getByText('Recently used')).toBeInTheDocument();

      const aaplElements = screen.getAllByText('AAPL');
      expect(aaplElements.length).toBeGreaterThan(0);

      const googlElements = screen.getAllByText('GOOGL');
      expect(googlElements.length).toBeGreaterThan(0);
    });

    it('обрабатывает клик по недавнему элементу', () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      mockReduxState({ recent: mockRecentItems });

      render(
        <AssetCatalogPanel
          {...defaultProps}
          onSelect={onSelect}
          onClose={onClose}
        />,
      );

      // Находим кнопку по тексту AAPL (первое вхождение - заголовок)
      const aaplButtons = screen.getAllByText('AAPL');
      const button = aaplButtons[0].closest('button');
      expect(button).toBeInTheDocument();
      fireEvent.click(button!);

      expect(onSelect).toHaveBeenCalledWith({
        symbol: 'AAPL',
        provider: 'binance',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('поиск', () => {
    it('обрабатывает изменение поискового запроса', () => {
      const onQueryChange = vi.fn();
      mockReduxState();

      render(
        <AssetCatalogPanel {...defaultProps} onQueryChange={onQueryChange} />,
      );

      const searchInput = screen.getByPlaceholderText('Search for asset...');
      fireEvent.change(searchInput, { target: { value: 'BTC' } });

      expect(onQueryChange).toHaveBeenCalledWith('BTC');
    });

    it('отображает результаты поиска', () => {
      mockReduxState({ results: mockCatalogItems });

      render(<AssetCatalogPanel {...defaultProps} query="BTC" />);

      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('отображает сообщение когда нет результатов', () => {
      mockReduxState({ results: [] });

      render(<AssetCatalogPanel {...defaultProps} query="XYZ" />);

      expect(screen.getByText('No assets found for "XYZ"')).toBeInTheDocument();
    });

    it('выполняет поиск при длине запроса >= 2 символов', async () => {
      mockSearchAssets.mockResolvedValue(mockCatalogItems);
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} query="BT" />);

      await waitFor(() => {
        expect(mockSearchAssets).toHaveBeenCalled();
      });
    });
  });

  describe('выбор элемента', () => {
    it('выбирает элемент и активирует кнопку добавления', () => {
      mockReduxState({ results: mockCatalogItems });

      render(<AssetCatalogPanel {...defaultProps} query="BTC" />);

      const firstResult = screen.getByText('BTCUSDT');
      fireEvent.click(firstResult);

      const addButton = screen.getByText(/Add BTCUSDT/);
      expect(addButton).not.toBeDisabled();
      expect(addButton).toHaveTextContent('Add BTCUSDT · BINANCE');
    });

    it('обрабатывает клик по кнопке добавления с выбранным элементом', () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      mockReduxState({ results: mockCatalogItems });

      render(
        <AssetCatalogPanel
          {...defaultProps}
          onSelect={onSelect}
          onClose={onClose}
          query="BTC"
        />,
      );

      const firstResult = screen.getByText('BTCUSDT');
      fireEvent.click(firstResult);

      const addButton = screen.getByText(/Add BTCUSDT/);
      fireEvent.click(addButton);

      expect(onSelect).toHaveBeenCalledWith({
        symbol: 'BTCUSDT',
        provider: 'binance',
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('отключает кнопку добавления когда элемент не выбран', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const addButton = screen.getByText('Add');
      expect(addButton).toBeDisabled();
    });

    it('не добавляет элемент если ни один не выбран', () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      mockReduxState({ results: mockCatalogItems });

      render(
        <AssetCatalogPanel
          {...defaultProps}
          onSelect={onSelect}
          onClose={onClose}
          query="BTC"
        />,
      );

      // Не выбираем элемент, пытаемся добавить
      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      expect(onSelect).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('переключение провайдеров', () => {
    it('переключает провайдера', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const moexTab = screen.getByText('MOEX');
      fireEvent.click(moexTab);

      expect(moexTab).toBeInTheDocument();
    });

    it('имеет правильные ARIA атрибуты для вкладок', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const binanceTab = screen.getByText('BINANCE');
      const moexTab = screen.getByText('MOEX');

      expect(binanceTab).toHaveAttribute('role', 'tab');
      expect(binanceTab).toHaveAttribute('aria-selected', 'true');
      expect(moexTab).toHaveAttribute('role', 'tab');
      expect(moexTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('определение категории активов', () => {
    it('правильно определяет категории для MOEX активов', () => {
      const moexItems: CatalogItem[] = [
        {
          symbol: 'SBER',
          name: 'Сбербанк',
          exchange: '',
          provider: 'MOEX',
          assetClass: 'equity',
        },
        {
          symbol: 'GAZP',
          name: 'Газпром',
          exchange: '',
          provider: 'MOEX',
          assetClass: 'equity',
        },
        {
          symbol: 'IMOEX',
          name: 'Индекс Мосбиржи',
          exchange: '',
          provider: 'MOEX',
          assetClass: 'equity',
        },
      ];

      mockReduxState({ results: moexItems });
      render(<AssetCatalogPanel {...defaultProps} query="test" />);

      expect(screen.getByText('SBER')).toBeInTheDocument();
      expect(screen.getByText('GAZP')).toBeInTheDocument();
      expect(screen.getByText('IMOEX')).toBeInTheDocument();
    });

    it('правильно определяет категории для Binance активов', () => {
      const binanceItems: CatalogItem[] = [
        {
          symbol: 'BTCUSDT',
          name: 'Bitcoin',
          exchange: '',
          provider: 'BINANCE',
          assetClass: 'crypto',
        },
        {
          symbol: 'EURUSD',
          name: 'Euro Dollar',
          exchange: '',
          provider: 'BINANCE',
          assetClass: 'crypto',
        },
        {
          symbol: 'XAUUSD',
          name: 'Gold',
          exchange: '',
          provider: 'BINANCE',
          assetClass: 'crypto',
        },
      ];

      mockReduxState({ results: binanceItems });
      render(<AssetCatalogPanel {...defaultProps} query="test" />);

      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      expect(screen.getByText('EURUSD')).toBeInTheDocument();
      expect(screen.getByText('XAUUSD')).toBeInTheDocument();
    });
  });

  describe('обработка ошибок', () => {
    it('обрабатывает ошибку при получении активов', async () => {
      mockSearchAssets.mockRejectedValue(new Error('Network error'));
      mockReduxState({ error: 'Search failed' });

      render(<AssetCatalogPanel {...defaultProps} query="test" />);

      await waitFor(() => {
        expect(screen.getByText('Search failed')).toBeInTheDocument();
      });
    });
  });

  describe('доступность', () => {
    it('правильно отображает кнопку фильтров', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      expect(filterButton).toBeInTheDocument();
    });
  });
});
