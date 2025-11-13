import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from '../../../features/history/HistorySearch';

describe('HistorySearch', () => {
  it('types in Search and calls onSearch with last value', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search/i);
    await userEvent.type(input, 'btc');

    expect(onSearch).toHaveBeenCalled();
    expect(onSearch).toHaveBeenLastCalledWith('btc');
  });

  it('opens filter popover, selects options and applies', async () => {
    const onApplyFilters = vi.fn();
    render(<SearchBar onSearch={() => {}} onApplyFilters={onApplyFilters} />);

    const filterBtn = screen.getByRole('button', { name: /фильтр|filter/i });
    await userEvent.click(filterBtn);

    const dialog = await screen.findByRole('dialog', { name: /filters/i });
    expect(dialog).toBeVisible();

    await userEvent.click(screen.getByLabelText(/ascending order/i));
    await userEvent.click(screen.getByLabelText(/category 1/i));

    await userEvent.click(screen.getByRole('button', { name: /apply/i }));

    expect(onApplyFilters).toHaveBeenCalledTimes(1);
    const payload = onApplyFilters.mock.calls[0][0];
    expect(payload.order).toBe('asc');
    expect(payload.categories).toEqual({ c1: true, c2: false, c3: false });
  });

  it('closes popover on outside click', async () => {
    render(<SearchBar onSearch={() => {}} />);

    const filterBtn = screen.getByRole('button', { name: /фильтр|filter/i });
    await userEvent.click(filterBtn);

    const dialog = await screen.findByRole('dialog', { name: /filters/i });
    expect(dialog).toBeVisible();

    fireEvent.mouseDown(document.body);

    expect(
      screen.queryByRole('dialog', { name: /filters/i }),
    ).not.toBeInTheDocument();
  });
});
