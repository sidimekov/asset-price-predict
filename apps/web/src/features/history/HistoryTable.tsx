// apps/web/src/features/history/HistoryTable.tsx
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
      raw['Factors (TOP 5): impact, SHAP, Conf.'] ??
      raw.factors_top5 ??
      [],
  } as Row;
}

export default function HistoryTable({ loading = false }: { loading?: boolean }) {
  const rows: Row[] = Array.isArray(data) ? (data as any[]).map(normalize) : [];


  if (loading) {
    return (
      <div className="mt-16 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height="48px" />
        ))}
      </div>
    );
  }


  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-40 text-white/60">
        No history yet.
      </div>
    );
  }


  return (
    <div className="mt-16 w-full overflow-x-auto">
      <div className="min-w-[1000px] backdrop-blur-sm">
        <table className="w-full border-separate text-sm text-white/90">
          <thead>
          <tr className="text-center gradient-header">
            <th className="rounded-l-[10px] px-4 py-3 font-semibold text-white bg-transparent">
              Asset
            </th>
            <th className="px-4 py-3 font-semibold text-white bg-transparent">
              Date
            </th>
            <th className="px-4 py-3 font-semibold text-white bg-transparent">
              Model
            </th>
            <th className="px-4 py-3 font-semibold text-white bg-transparent">
              Input
            </th>
            <th className="px-4 py-3 font-semibold text-white bg-transparent">
              Period
            </th>
            <th
              className="rounded-r-[10px] px-4 py-3 font-semibold text-white bg-transparent"
              colSpan={5}
            >
              Factors (TOP 5): impact, SHAP, Conf.
            </th>
          </tr>
          </thead>

          <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="text-[#8480C9] table-row">
              <td className="px-4 py-3">{r.asset}</td>
              <td className="px-4 py-3">{r.date}</td>
              <td className="px-4 py-3">{r.model}</td>
              <td className="px-4 py-3">{r.input}</td>
              <td className="px-4 py-3 whitespace-pre-line">{r.period}</td>

              {Array.from({ length: 5 }).map((_, i) => (
                <td key={i} className="px-4 py-3 text-[#8480C9]">
                  {r.factors_top5?.[i] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
