import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useHistory } from '@/entities/history/useHistory';
import type { HistoryEntry } from '@/entities/history/model';

const listMock = vi.fn();

vi.mock('@/entities/history/repository', () => ({
  historyRepository: {
    list: (...args: any[]) => listMock(...args),
  },
}));

function TestComponent() {
  const { items, loading, error } = useHistory();
  return (
    <div
      data-testid="state"
      data-loading={loading ? 'yes' : 'no'}
      data-count={items.length}
      data-error={error ?? ''}
    />
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
    listMock.mockReset();
  });

  it('loads history successfully', async () => {
    listMock.mockResolvedValueOnce([makeEntry('1'), makeEntry('2')]);
    render(<TestComponent />);

    await waitFor(() => {
      const state = screen.getByTestId('state');
      expect(state.getAttribute('data-loading')).toBe('no');
      expect(state.getAttribute('data-count')).toBe('2');
      expect(state.getAttribute('data-error')).toBe('');
    });
  });

  it('handles repository errors', async () => {
    listMock.mockRejectedValueOnce(new Error('boom'));
    render(<TestComponent />);

    await waitFor(() => {
      const state = screen.getByTestId('state');
      expect(state.getAttribute('data-loading')).toBe('no');
      expect(state.getAttribute('data-error')).toBe('boom');
    });
  });
});
