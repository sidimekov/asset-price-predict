import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import HistorySearch from '@/features/history/HistorySearch';

describe('HistorySearch', () => {
  afterEach(() => {
    cleanup();
  });

  const openFilters = () => {
    const filterButton = screen.getByLabelText('Фильтры');
    fireEvent.click(filterButton);
  };

  it('calls searchAction when user types in input', () => {
    const searchAction = vi.fn();

    render(<HistorySearch searchAction={searchAction} />);

    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'btc' } });

    expect(searchAction).toHaveBeenCalledWith('btc');
  });

  it('calls applyFiltersAction when Apply button is clicked', () => {
    const searchAction = vi.fn();
    const applyFiltersAction = vi.fn();

    render(
      <HistorySearch
        searchAction={searchAction}
        applyFiltersAction={applyFiltersAction}
      />,
    );

    const filterButton = screen.getByLabelText('Фильтры');
    fireEvent.click(filterButton);

    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);

    expect(applyFiltersAction).toHaveBeenCalledTimes(1);
  });

  it('applies selected provider, asset class, currency, and order', () => {
    const searchAction = vi.fn();
    const applyFiltersAction = vi.fn();

    render(
      <HistorySearch
        searchAction={searchAction}
        applyFiltersAction={applyFiltersAction}
        currencyOptions={['USD']}
      />,
    );

    openFilters();

    fireEvent.click(screen.getByLabelText('BINANCE'));
    fireEvent.click(screen.getByLabelText('CRYPTO'));
    fireEvent.click(screen.getByLabelText('USD'));
    fireEvent.click(screen.getByLabelText('Ascending order'));

    fireEvent.click(screen.getByText('Apply'));

    expect(applyFiltersAction).toHaveBeenCalledTimes(1);
    expect(applyFiltersAction).toHaveBeenCalledWith(
      expect.objectContaining({
        providers: expect.objectContaining({ binance: true }),
        assetClasses: expect.objectContaining({ crypto: true }),
        currencies: expect.objectContaining({ USD: true }),
        order: 'asc',
      }),
    );
  });

  it('renders "No currencies" when currency options are empty', async () => {
    const searchAction = vi.fn();
    const applyFiltersAction = vi.fn();

    const { rerender } = render(
      <HistorySearch
        searchAction={searchAction}
        applyFiltersAction={applyFiltersAction}
        currencyOptions={['USD']}
      />,
    );

    openFilters();
    expect(screen.getByLabelText('USD')).toBeInTheDocument();

    rerender(
      <HistorySearch
        searchAction={searchAction}
        applyFiltersAction={applyFiltersAction}
        currencyOptions={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('No currencies')).toBeInTheDocument();
    });
  });

  it('closes filters popover when clicking outside', () => {
    const searchAction = vi.fn();

    render(<HistorySearch searchAction={searchAction} />);

    openFilters();
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(
      screen.queryByRole('dialog', { name: 'Filters' }),
    ).not.toBeInTheDocument();
  });
});
