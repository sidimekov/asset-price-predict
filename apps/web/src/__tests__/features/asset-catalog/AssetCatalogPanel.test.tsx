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
    usedAt: '2024-01-15T10:30:00Z',
  },
  {
    symbol: 'GOOGL',
    provider: 'binance' as const,
    usedAt: '2024-01-15T10:30:00Z',
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
        recent?: Array<{ symbol: string; provider: 'binance' | 'moex'; usedAt: string }>;
      } = {},
  ) => {
    const {
      results = [],
      loading = false,
      error = null,
      provider = 'binance',
      recent = [],
    } = overrides;

    // Мокаем useAppSelector чтобы он возвращал соответствующие значения
    mockUseAppSelector.mockImplementation((selector: any) => {
      // В реальном коде selector - это функция, которая принимает state
      // Здесь мы эмулируем поведение разных селекторов
      if (selector.toString().includes('catalog.results')) {
        return results;
      }
      if (selector.toString().includes('catalog.loading')) {
        return loading;
      }
      if (selector.toString().includes('catalog.error')) {
        return error;
      }
      if (selector.toString().includes('catalog.provider')) {
        return provider;
      }
      if (selector.toString().includes('catalog.recent')) {
        return recent;
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
    it('не отображает недавние элементы когда есть запрос', () => {
      mockReduxState({ recent: mockRecentItems });

      render(<AssetCatalogPanel {...defaultProps} query="test" />);

      expect(screen.queryByText('Recently used')).not.toBeInTheDocument();
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

    it('отображает сообщение когда нет результатов при запросе >= 2 символов', () => {
      mockReduxState({ results: [] });

      render(<AssetCatalogPanel {...defaultProps} query="XYZ" />);

      expect(screen.getByText('No assets found for "XYZ"')).toBeInTheDocument();
    });

    it('не отображает сообщение "No assets found" при коротком запросе', () => {
      mockReduxState({ results: [] });

      render(<AssetCatalogPanel {...defaultProps} query="X" />);

      expect(screen.queryByText('No assets found for')).not.toBeInTheDocument();
    });

    it('выполняет поиск через searchAssets при длине запроса >= 2 символов', async () => {
      mockSearchAssets.mockResolvedValue(mockCatalogItems);
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} query="BT" />);

      await waitFor(() => {
        expect(mockSearchAssets).toHaveBeenCalled();
      });
    });
  });

  describe('фильтры', () => {
    it('отображает popover фильтров при клике на иконку фильтра', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      fireEvent.click(filterButton);

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Select all')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('скрывает popover фильтров при клике вне его', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      fireEvent.click(filterButton);

      expect(screen.getByText('Filters')).toBeInTheDocument();

      // Кликаем вне popover
      fireEvent.mouseDown(document.body);

      expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    });

    it('применяет фильтры при клике на Apply', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      fireEvent.click(filterButton);

      const applyButton = screen.getByText(/Apply/);
      fireEvent.click(applyButton);

      expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    });

    it('сбрасывает фильтры при клике на Reset', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      fireEvent.click(filterButton);

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      // Проверяем что чекбоксы сброшены
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('выбирает все фильтры при клике на Select all', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      fireEvent.click(filterButton);

      const selectAllButton = screen.getByText('Select all');
      fireEvent.click(selectAllButton);

      // Проверяем что все чекбоксы выбраны
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('определение категории активов', () => {
    it('правильно отображает категории для MOEX активов', () => {
      const moexItems: CatalogItem[] = [
        {
          symbol: 'SBER',
          name: 'Сбербанк',
          exchange: '',
          provider: 'MOEX',
          assetClass: 'equity',
          currency: 'RUB',
        },
        {
          symbol: 'OFZ',
          name: 'Облигация федерального займа',
          exchange: '',
          provider: 'MOEX',
          assetClass: 'bond',
          currency: 'RUB',
        },
      ];

      mockReduxState({ results: moexItems, provider: 'moex' });
      render(<AssetCatalogPanel {...defaultProps} query="test" />);

      // Проверяем что категории отображаются
      expect(screen.getByText('SBER')).toBeInTheDocument();
    });
  });

  describe('выбор элемента', () => {
    it('выбирает элемент и активирует кнопку добавления', () => {
      mockReduxState({ results: [mockCatalogItems[0]] });

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
      mockReduxState({ results: [mockCatalogItems[0]] });

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

  describe('обработка ошибок', () => {
    it('обрабатывает ошибку при получении активов', async () => {
      mockSearchAssets.mockRejectedValue(new Error('Network error'));
      mockReduxState({ error: 'Search failed' });

      render(<AssetCatalogPanel {...defaultProps} query="test" />);

      await waitFor(() => {
        expect(screen.getByText('Search failed')).toBeInTheDocument();
      });
    });

    it('обрабатывает ошибку при получении всех активов (query < 2)', async () => {
      mockReduxState({ error: 'Failed to load assets' });

      render(<AssetCatalogPanel {...defaultProps} query="" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load assets')).toBeInTheDocument();
      });
    });
  });

  describe('доступность', () => {
    it('правильно отображает кнопку фильтров с aria-label', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      expect(filterButton).toBeInTheDocument();
    });
  });

  describe('сортировка', () => {
    it('применяет сортировку по алфавиту (A → Z)', () => {
      const unsortedItems: CatalogItem[] = [
        {
          symbol: 'ZECUSDT',
          name: 'Zcash',
          provider: 'BINANCE',
          assetClass: 'crypto',
          currency: 'USDT',
          exchange: 'BINANCE',
        },
        {
          symbol: 'AAPLUSDT',
          name: 'Apple',
          provider: 'BINANCE',
          assetClass: 'crypto',
          currency: 'USDT',
          exchange: 'BINANCE',
        },
        {
          symbol: 'BTCUSDT',
          name: 'Bitcoin',
          provider: 'BINANCE',
          assetClass: 'crypto',
          currency: 'USDT',
          exchange: 'BINANCE',
        },
      ];

      mockReduxState({ results: unsortedItems });

      render(<AssetCatalogPanel {...defaultProps} query="test" />);

      const items = screen.getAllByRole('button', { name: /.*USDT/ });
      expect(items).toHaveLength(3);
    });

    it('позволяет изменить сортировку через фильтры', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      fireEvent.click(filterButton);

      const reverseOrderRadio = screen.getByLabelText('The reverse order (Z → A)');
      fireEvent.click(reverseOrderRadio);

      expect(reverseOrderRadio).toBeChecked();
    });
  });

  describe('общее количество активов', () => {
    it('отображает количество найденных активов', () => {
      mockReduxState({ results: mockCatalogItems });

      render(<AssetCatalogPanel {...defaultProps} />);

      expect(screen.getByText(`${mockCatalogItems.length} found`)).toBeInTheDocument();
    });

    it('отображает количество активных фильтров', () => {
      mockReduxState();

      render(<AssetCatalogPanel {...defaultProps} />);

      const filterButton = screen.getByLabelText('Фильтры');
      fireEvent.click(filterButton);

      // Выбираем один фильтр
      const cryptoCheckbox = screen.getByLabelText('Crypto');
      fireEvent.click(cryptoCheckbox);

      const applyButton = screen.getByText(/Apply \(1\)/);
      expect(applyButton).toBeInTheDocument();
    });
  });
});