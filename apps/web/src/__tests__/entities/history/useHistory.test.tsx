import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useHistory } from '@/entities/history/useHistory';
import type { HistoryEntry } from '@/entities/history/model';

const listPageMock = vi.fn();

vi.mock('@/entities/history/repository', () => ({
  historyRepository: {
    listPage: (...args: any[]) => listPageMock(...args),
  },
}));

function TestComponent() {
  const { items, loading, error, page, limit, total, setPage, setLimit } =
    useHistory();

  return (
    <div
      data-testid="state"
      data-loading={loading ? 'yes' : 'no'}
      data-count={items.length}
      data-error={error ?? ''}
      data-page={page}
      data-limit={limit}
      data-total={total}
    >
      <button data-testid="next-page" onClick={() => setPage(page + 1)}>
        Next
      </button>
      <button data-testid="set-limit" onClick={() => setLimit(limit + 10)}>
        Limit
      </button>
    </div>
  );
}

const makeEntry = (id: string): HistoryEntry => ({
  id,
  created_at: '2025-01-01T00:00:00.000Z',
  symbol: 'BTC',
  tf: '1h',
  horizon: 2,
  provider: 'MOEX',
  p50: [[1, 1]],
  meta: { runtime_ms: 1, backend: 'client' },
});

describe('useHistory', () => {
  beforeEach(() => {
    listPageMock.mockReset();
  });

  it('loads paginated history successfully', async () => {
    listPageMock.mockResolvedValueOnce({
      items: [makeEntry('1')],
      total: 1,
      page: 1,
      limit: 20,
    });

    render(<TestComponent />);

    await waitFor(() => {
      const state = screen.getByTestId('state');
      expect(state.getAttribute('data-loading')).toBe('no');
      expect(state.getAttribute('data-count')).toBe('1');
      expect(state.getAttribute('data-error')).toBe('');
      expect(state.getAttribute('data-page')).toBe('1');
      expect(state.getAttribute('data-limit')).toBe('20');
      expect(state.getAttribute('data-total')).toBe('1');
    });
  });

  it('handles repository errors', async () => {
    listPageMock.mockRejectedValueOnce(new Error('boom'));
    render(<TestComponent />);

    await waitFor(() => {
      const state = screen.getByTestId('state');
      expect(state.getAttribute('data-loading')).toBe('no');
      expect(state.getAttribute('data-error')).toBe('boom');
    });
  });

  it('changes page when setPage is called', async () => {
    listPageMock
      .mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      })
      .mockResolvedValueOnce({
        items: [makeEntry('2')],
        total: 1,
        page: 2,
        limit: 20,
      });

    render(<TestComponent />);

    await waitFor(() => {
      expect(listPageMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId('next-page'));

    await waitFor(() => {
      expect(listPageMock).toHaveBeenCalledTimes(2);
      const state = screen.getByTestId('state');
      expect(state.getAttribute('data-page')).toBe('2');
    });
  });

  it('changes limit when setLimit is called', async () => {
    listPageMock
      .mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      })
      .mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 30,
      });

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('set-limit'));

    await waitFor(() => {
      expect(listPageMock).toHaveBeenCalledTimes(2);
      const state = screen.getByTestId('state');
      expect(state.getAttribute('data-limit')).toBe('30');
    });
  });
});
