import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HistoryPage from '@/app/history/page';
import type { HistoryFilters } from '@/features/history/HistorySearch';

const useHistoryMock = vi.fn();
const setPageMock = vi.fn();
const setLimitMock = vi.fn();

vi.mock('@/entities/history/useHistory', () => ({
  useHistory: () => useHistoryMock(),
}));

// Мокируем компоненты
const searchBarMock = vi.fn();

vi.mock('@/features/history/HistorySearch', () => ({
  default: (props: {
    searchAction: (q: string) => void;
    applyFiltersAction?: (filters: HistoryFilters) => void;
    currencyOptions?: string[];
  }) => {
    searchBarMock(props);
    return (
      <input
        data-testid="search-bar"
        onChange={(e) => props.searchAction(e.target.value)}
        placeholder="Search"
      />
    );
  },
}));

const historyTableMock = vi.fn();

vi.mock('@/features/history/HistoryTable', () => ({
  default: (props: { loading: boolean; items?: any[] }) => {
    historyTableMock(props);
    return (
      <div data-testid="history-table">
        {props.loading ? 'Loading...' : `Rows:${props.items?.length ?? 0}`}
      </div>
    );
  },
}));

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useHistoryMock.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      page: 1,
      limit: 20,
      total: 0,
      setPage: setPageMock,
      setLimit: setLimitMock,
      refresh: vi.fn(),
    });
  });

  const baseFilters: HistoryFilters = {
    providers: { binance: false, moex: false, mock: false },
    assetClasses: {
      equity: false,
      fx: false,
      crypto: false,
      etf: false,
      bond: false,
      other: false,
    },
    currencies: {},
    order: 'desc',
  };

  test('passes loading=false to HistoryTable by default', () => {
    render(<HistoryPage />);
    expect(screen.getByTestId('history-table')).toHaveTextContent('Rows:0');
  });

  test('initial loading state is false', () => {
    render(<HistoryPage />);
    const table = screen.getByTestId('history-table');
    expect(table).not.toHaveTextContent('Loading...');
  });

  test('shows error message when history load fails', () => {
    useHistoryMock.mockReturnValueOnce({
      items: [],
      loading: false,
      error: 'Failed to load',
      page: 1,
      limit: 20,
      total: 0,
      setPage: setPageMock,
      setLimit: setLimitMock,
      refresh: vi.fn(),
    });

    render(<HistoryPage />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  test('filters items by search query', () => {
    useHistoryMock.mockReturnValue({
      items: [
        {
          id: '1',
          symbol: 'BTC',
          provider: 'MOEX',
          created_at: '2025-01-01T00:00:00.000Z',
          tf: '1h',
          horizon: 2,
          p50: [[1, 1]],
          meta: { runtime_ms: 1, backend: 'client' },
        },
        {
          id: '2',
          symbol: 'ETH',
          provider: 'BINANCE',
          created_at: '2025-01-02T00:00:00.000Z',
          tf: '1h',
          horizon: 2,
          p50: [[1, 1]],
          meta: { runtime_ms: 1, backend: 'client' },
        },
      ],
      loading: false,
      error: null,
      page: 1,
      limit: 20,
      total: 2,
      setPage: setPageMock,
      setLimit: setLimitMock,
      refresh: vi.fn(),
    });

    render(<HistoryPage />);

    const input = screen.getByTestId('search-bar');
    const initialCall =
      historyTableMock.mock.calls[historyTableMock.mock.calls.length - 1];
    expect(initialCall[0].items).toHaveLength(2);

    fireEvent.change(input, { target: { value: 'btc' } });

    const lastCall =
      historyTableMock.mock.calls[historyTableMock.mock.calls.length - 1];
    expect(lastCall[0].items).toHaveLength(1);
  });

  test('pagination buttons call setters', () => {
    useHistoryMock.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      page: 2,
      limit: 10,
      total: 30,
      setPage: setPageMock,
      setLimit: setLimitMock,
      refresh: vi.fn(),
    });

    render(<HistoryPage />);

    fireEvent.click(screen.getByTestId('history-prev'));
    expect(setPageMock).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByTestId('history-next'));
    expect(setPageMock).toHaveBeenCalledWith(3);

    fireEvent.change(screen.getByTestId('history-limit'), {
      target: { value: '50' },
    });
    expect(setLimitMock).toHaveBeenCalledWith(50);
  });

  test('filters items by provider and currency', () => {
    useHistoryMock.mockReturnValue({
      items: [
        {
          id: '1',
          symbol: 'BTCUSDT',
          provider: 'BINANCE',
          created_at: '2025-01-01T00:00:00.000Z',
          tf: '1h',
          horizon: 2,
          p50: [[1, 1]],
          meta: { runtime_ms: 1, backend: 'client' },
        },
        {
          id: '2',
          symbol: 'SBER',
          provider: 'MOEX',
          created_at: '2025-01-02T00:00:00.000Z',
          tf: '1h',
          horizon: 2,
          p50: [[1, 1]],
          meta: { runtime_ms: 1, backend: 'client' },
        },
      ],
      loading: false,
      error: null,
      page: 1,
      limit: 20,
      total: 2,
      setPage: setPageMock,
      setLimit: setLimitMock,
      refresh: vi.fn(),
    });

    render(<HistoryPage />);

    act(() => {
      const props = searchBarMock.mock.calls.at(-1)?.[0];
      props.applyFiltersAction?.({
        ...baseFilters,
        providers: { ...baseFilters.providers, binance: true },
        currencies: { USD: true },
      });
    });

    const lastCall =
      historyTableMock.mock.calls[historyTableMock.mock.calls.length - 1];
    expect(lastCall[0].items).toHaveLength(1);
    expect(lastCall[0].items?.[0].symbol).toBe('BTCUSDT');
  });

  test('applies ascending sort order', () => {
    useHistoryMock.mockReturnValue({
      items: [
        {
          id: '1',
          symbol: 'ETHUSDT',
          provider: 'BINANCE',
          created_at: '2025-01-03T00:00:00.000Z',
          tf: '1h',
          horizon: 2,
          p50: [[1, 1]],
          meta: { runtime_ms: 1, backend: 'client' },
        },
        {
          id: '2',
          symbol: 'AAPL',
          provider: 'MOEX',
          created_at: '2025-01-01T00:00:00.000Z',
          tf: '1h',
          horizon: 2,
          p50: [[1, 1]],
          meta: { runtime_ms: 1, backend: 'client' },
        },
      ],
      loading: false,
      error: null,
      page: 1,
      limit: 20,
      total: 2,
      setPage: setPageMock,
      setLimit: setLimitMock,
      refresh: vi.fn(),
    });

    render(<HistoryPage />);

    act(() => {
      const props = searchBarMock.mock.calls.at(-1)?.[0];
      props.applyFiltersAction?.({ ...baseFilters, order: 'asc' });
    });

    const lastCall =
      historyTableMock.mock.calls[historyTableMock.mock.calls.length - 1];
    expect(lastCall[0].items?.[0].symbol).toBe('AAPL');
  });
});
