import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

const mockRows: any[] = [];

vi.mock('@/mocks/history.json', () => {
  return { default: mockRows };
});

vi.mock('@/shared/ui/Skeleton', () => {
  return {
    default: (props: any) => (
      <div data-testid="skeleton" data-height={props.height} />
    ),
  };
});

describe('HistoryTable', () => {
  beforeEach(() => {
    mockRows.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows 5 skeleton rows when loading=true', async () => {
    mockRows.push({
      asset: 'BTC',
      date: '2025-10-28',
      model: 'M',
      input: 'I',
      period: 'P',
      factors_top5: [],
    });

    const Comp = (await import('@/features/history/HistoryTable')).default;
    render(<Comp loading />);

    const skels = screen.getAllByTestId('skeleton');
    expect(skels).toHaveLength(5);
    expect(skels[0]).toHaveAttribute('data-height', '48px');
  });

  it('renders empty state when no rows', async () => {
    mockRows.length = 0;

    const Comp = (await import('@/features/history/HistoryTable')).default;
    render(<Comp />);

    expect(screen.getByText('No history yet.')).toBeInTheDocument();
  });

  it('renders table and fills missing factors with "—"', async () => {
    mockRows.length = 0;
    mockRows.push({
      Asset: 'BTC',
      Data: '2025-10-28',
      Model: 'Some model 1',
      Input: 'Some input',
      Period: 'from 2025-10-03 to 2025-10-28',
      'Factors (TOP 5): impact, SHAP, Conf.': ['f1', 'f2', 'f3'], // только 3 фактора
    });

    const Comp = (await import('@/features/history/HistoryTable')).default;
    render(<Comp />);

    const table = screen.getByRole('table');

    const [thead] = within(table).getAllByRole('rowgroup');
    const headerRow = within(thead).getAllByRole('row')[0];

    expect(headerRow).toHaveTextContent(/Asset/);
    expect(headerRow).toHaveTextContent(/Date/);
    expect(headerRow).toHaveTextContent(/Model/);
    expect(headerRow).toHaveTextContent(/Input/);
    expect(headerRow).toHaveTextContent(/Period/);
    expect(headerRow).toHaveTextContent(/Factors/i);

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('2025-10-28')).toBeInTheDocument();
    expect(screen.getByText('Some model 1')).toBeInTheDocument();
    expect(screen.getByText('Some input')).toBeInTheDocument();

    expect(screen.getByText('f1')).toBeInTheDocument();
    expect(screen.getByText('f2')).toBeInTheDocument();
    expect(screen.getByText('f3')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
