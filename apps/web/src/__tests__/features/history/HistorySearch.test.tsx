import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import HistorySearch from '@/features/history/HistorySearch';

describe('HistorySearch', () => {
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
});
