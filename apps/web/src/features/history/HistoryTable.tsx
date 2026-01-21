'use client';

import Link from 'next/link';
import Skeleton from '@/shared/ui/Skeleton';
import type { HistoryEntry } from '@/entities/history/model';
import { track } from '@/shared/analytics';
import { AnalyticsEvent } from '@/shared/analytics/events';

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
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
      <div style={{ minWidth: '720px', backdropFilter: 'blur(10px)' }}>
        <table className="history-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Date</th>
              <th>Model</th>
              <th>Provider</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
