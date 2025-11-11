'use client';

import Skeleton from '@/shared/ui/Skeleton';
import data from '@/mocks/history.json';

type Row = {
  asset: string;
  date: string;
  model: string;
  input: string;
  period: string;
  factors_top5: string[];
};

function normalize(raw: any): Row {
  if ('asset' in raw) return raw as Row;
  return {
    asset: raw.Asset,
    date: raw.Data,
    model: raw.Model,
    input: raw.Input,
    period: (raw.Period || '').trim(),
    factors_top5:
      raw['Factors (TOP 5): impact, SHAP, Conf.'] ?? raw.factors_top5 ?? [],
  } as Row;
}

export default function HistoryTable({
  loading = false,
}: {
  loading?: boolean;
}) {
  const rows: Row[] = Array.isArray(data) ? (data as any[]).map(normalize) : [];

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
              <th>Input</th>
              <th>Period</th>
              <th colSpan={5}>Factors (TOP 5): impact, SHAP, Conf.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td>{r.asset}</td>
                <td>{r.date}</td>
                <td>{r.model}</td>
                <td>{r.input}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{r.period}</td>
                {Array.from({ length: 5 }).map((_, i) => (
                  <td key={i}>{r.factors_top5?.[i] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
