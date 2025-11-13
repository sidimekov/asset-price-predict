import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryPage from '@/app/history/page';

// Мокируем компоненты
vi.mock('@/features/history/HistorySearch', () => ({
  default: ({ onSearch }: { onSearch: (q: string) => void }) => (
    <input
      data-testid="search-bar"
      onChange={(e) => onSearch(e.target.value)}
      placeholder="Search"
    />
  ),
}));

vi.mock('@/features/history/HistoryTable', () => ({
  default: ({ loading }: { loading: boolean }) => (
    <div data-testid="history-table">
      {loading ? 'Loading...' : 'Table Content'}
    </div>
  ),
}));

describe('HistoryPage', () => {
  test('passes loading=false to HistoryTable by default', () => {
    render(<HistoryPage />);
    expect(screen.getByTestId('history-table')).toHaveTextContent(
      'Table Content',
    );
  });

  test('initial loading state is false', () => {
    render(<HistoryPage />);
    const table = screen.getByTestId('history-table');
    expect(table).not.toHaveTextContent('Loading...');
  });
});
