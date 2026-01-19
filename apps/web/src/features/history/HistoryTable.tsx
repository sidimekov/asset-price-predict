'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Skeleton from '@/shared/ui/Skeleton';
import type { HistoryEntry } from '@/entities/history/model';

const DEFAULT_WINDOW = 200;

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

function buildForecastHref(entry: HistoryEntry): string {
  const searchParams = new globalThis.URLSearchParams({
    provider: entry.provider,
    tf: entry.tf,
    window: String(DEFAULT_WINDOW),
  });
  return `/forecast/${encodeURIComponent(entry.symbol)}?${searchParams.toString()}`;
}

export default function HistoryTable({
  loading = false,
  items,
}: {
  loading?: boolean;
  items?: HistoryEntry[];
}) {
  const router = useRouter();
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
            {rows.map((entry) => {
              const href = buildForecastHref(entry);
              return (
                <tr
                  key={entry.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open forecast for ${entry.symbol}`}
                  onClick={() => router.push(href)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(href);
                    }
                  }}
                >
                  <td>
                    <Link href={href}>{entry.symbol}</Link>
                  </td>
                  <td>{formatDate(entry.created_at)}</td>
                  <td>{entry.meta.model_ver ?? '—'}</td>
                  <td>{entry.provider}</td>
                  <td style={{ whiteSpace: 'pre-line' }}>
                    {entry.tf} / {entry.horizon}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
