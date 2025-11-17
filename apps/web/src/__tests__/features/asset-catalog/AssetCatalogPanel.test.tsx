import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AssetCatalogPanel } from '@/features/asset-catalog/ui/AssetCatalogPanel';

// Полностью заменяем debounce на простую функцию
vi.mock('lodash.debounce', () => ({
  default: vi.fn((fn) => {
    const wrappedFn = (...args: any[]) => fn(...args);
    wrappedFn.cancel = vi.fn();
    return wrappedFn;
  }),
}));

// Мокаем normalizeCatalogResponse
vi.mock('../../lib/normalizeCatalogItem', () => ({
  normalizeCatalogResponse: vi.fn(() => []),
}));

// Мокаем fetch чтобы не делать реальные запросы
global.fetch = vi.fn();

const createMockStore = (state = {}) => {
  return configureStore({
    reducer: {
      catalog: () => ({
        results: [],
        recent: [],
        loading: false,
        error: null,
        query: '',
        provider: 'binance',
        selected: undefined,
        ...state,
      }),
    },
  });
};

describe('AssetCatalogPanel', () => {
  const defaultProps = {
    query: '',
    onQueryChange: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic elements', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <AssetCatalogPanel {...defaultProps} />
      </Provider>,
    );

    expect(screen.getByText('Find Assets')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search for asset...'),
    ).toBeInTheDocument();
    expect(screen.getByText('BINANCE')).toBeInTheDocument();
    expect(screen.getByText('MOEX')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const store = createMockStore({ loading: true });

    render(
      <Provider store={store}>
        <AssetCatalogPanel {...defaultProps} />
      </Provider>,
    );

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });
});
