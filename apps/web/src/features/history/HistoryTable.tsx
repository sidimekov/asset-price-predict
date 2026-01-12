'use client';

import Link from 'next/link';
import Skeleton from '@/shared/ui/Skeleton';
import type { HistoryEntry } from '@/entities/history/model';

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

function formatFactor(
  factor: NonNullable<HistoryEntry['explain']>[number],
): string {
  const impact = `${factor.sign}${factor.impact_abs.toFixed(3)}`;
  const shap = factor.shap !== undefined ? `, shap ${factor.shap}` : '';
  const conf =
    factor.confidence !== undefined
      ? `, conf ${(factor.confidence * 100).toFixed(0)}%`
      : '';
  return `${factor.name} (${impact}${shap}${conf})`;
}

function toFactors(entry: HistoryEntry): string[] {
  if (!entry.explain?.length) return [];
  return entry.explain.slice(0, 5).map(formatFactor);
}

export default function HistoryTable({
  loading = false,
  items,
}: {
  loading?: boolean;
  items?: HistoryEntry[];
}) {
  const rows = items ?? [];

  if (loading) {
    return (
      <div className="loading-container">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height="48px" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <div className="no-history">No history yet.</div>;
  }

  return (
    <div className="history-table-container">
      <div style={{ minWidth: '1000px', backdropFilter: 'blur(10px)' }}>
        <table className="history-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Date</th>
              <th>Model</th>
              <th>Provider</th>
              <th>Period</th>
              <th colSpan={5}>Factors (TOP 5): impact, SHAP, Conf.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => {
              const factors = toFactors(entry);
              return (
                <tr key={entry.id}>
                  <td>
                    <Link href={`/forecast/${entry.id}`}>{entry.symbol}</Link>
                  </td>
                  <td>{formatDate(entry.created_at)}</td>
                  <td>{entry.meta.model_ver ?? '—'}</td>
                  <td>{entry.provider}</td>
                  <td style={{ whiteSpace: 'pre-line' }}>
                    {entry.tf} / {entry.horizon}
                  </td>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <td key={i}>{factors[i] ?? '—'}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
