import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { HistoryEntry } from '@/entities/history/model';

vi.mock('@/shared/ui/Skeleton', () => {
  return {
    default: (props: any) => (
      <div data-testid="skeleton" data-height={props.height} />
    ),
  };
});

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('HistoryTable', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows 5 skeleton rows when loading=true', async () => {
    const Comp = (await import('@/features/history/HistoryTable')).default;
    render(<Comp loading />);

    const skels = screen.getAllByTestId('skeleton');
    expect(skels).toHaveLength(5);
    expect(skels[0]).toHaveAttribute('data-height', '48px');
  });

  it('renders empty state when no rows', async () => {
    const Comp = (await import('@/features/history/HistoryTable')).default;
    render(<Comp />);

    expect(screen.getByText('No history yet.')).toBeInTheDocument();
  });

  it('renders table and fills missing factors with "—"', async () => {
    const items: HistoryEntry[] = [
      {
        id: 'id-1',
        created_at: '2025-10-28T10:00:00.000Z',
        symbol: 'BTC',
        tf: '1h',
        horizon: 12,
        provider: 'MOEX',
        p50: [
          [1, 100],
          [2, 101],
        ],
        meta: { runtime_ms: 12, backend: 'client', model_ver: 'v1' },
        explain: [
          {
            name: 'Factor A',
            group: 'g1',
            impact_abs: 0.12,
            sign: '+',
          },
          {
            name: 'Factor B',
            group: 'g1',
            impact_abs: 0.08,
            sign: '-',
          },
          {
            name: 'Factor C',
            group: 'g1',
            impact_abs: 0.05,
            sign: '+',
          },
        ],
      },
    ];

    const Comp = (await import('@/features/history/HistoryTable')).default;
    render(<Comp items={items} />);

    const table = screen.getByRole('table');

    const [thead] = within(table).getAllByRole('rowgroup');
    const headerRow = within(thead).getAllByRole('row')[0];

    expect(headerRow).toHaveTextContent(/Asset/);
    expect(headerRow).toHaveTextContent(/Date/);
    expect(headerRow).toHaveTextContent(/Model/);
    expect(headerRow).toHaveTextContent(/Provider/);
    expect(headerRow).toHaveTextContent(/Period/);
    expect(headerRow).toHaveTextContent(/Factors/i);

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('2025-10-28T10:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('MOEX')).toBeInTheDocument();

    expect(screen.getByText(/Factor A/)).toBeInTheDocument();
    expect(screen.getByText(/Factor B/)).toBeInTheDocument();
    expect(screen.getByText(/Factor C/)).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
