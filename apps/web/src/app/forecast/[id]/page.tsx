'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import ForecastShapePlaceholder from '@/widgets/chart/ForecastShapePlaceholder';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import ParamsPanel from '@/features/params/ParamsPanel';
import FactorsTable from '@/features/factors/FactorsTable';
import type { FactorRow } from '@/features/factors/FactorsTable';
import { historyRepository } from '@/entities/history/repository';
import type { HistoryEntry } from '@/entities/history/model';

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ParamsState = 'idle' | 'loading' | 'error' | 'success';

export default function ForecastPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const id = params.id;

  const [entry, setEntry] = React.useState<HistoryEntry | null>(null);
  const [entryLoading, setEntryLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setEntry(null);
    setEntryLoading(true);
    historyRepository
      .getById(String(id))
      .then((found) => {
        if (active) setEntry(found);
      })
      .finally(() => {
        if (active) setEntryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const displaySymbol = entry?.symbol || String(id);
  const selectedPrice = '—'; // Цена остается фиксированной как в оригинале

  const [chartState, setChartState] = React.useState<State>('idle');
  const [paramsState, setParamsState] = React.useState<ParamsState>('idle');

  React.useEffect(() => {
    setChartState('loading');
    setParamsState('loading');
    // chart and params placeholders are loaded by timeout

    const t = setTimeout(() => {
      setChartState('ready');
      setParamsState('success');
    }, 1200);

    return () => clearTimeout(t);
  }, []);

  const handleBackToAssets = () => {
    router.push('/dashboard');
  };

  const forecastTimeLabels = [
    '6:00AM',
    '12:00AM',
    '6:00PM',
    '12:00PM',
    '6:00AM',
    '12:00AM',
    '6:00PM',
    '12:00PM',
    '6:00AM',
    '12:00AM',
    '6:00PM',
    '12:00PM',
    '6:00AM',
    '12:00AM',
  ];

  const factors: FactorRow[] =
    entry?.explain?.map((f) => ({
      name: f.name,
      impact: `${f.sign}${f.impact_abs.toFixed(3)}`,
      shap: f.shap !== undefined ? String(f.shap) : undefined,
      conf:
        f.confidence !== undefined
          ? `${(f.confidence * 100).toFixed(0)}%`
          : undefined,
    })) ?? [];

  const factorsState: State = entryLoading
    ? 'loading'
    : factors.length
      ? 'ready'
      : 'empty';

  const seriesRows = entry
    ? entry.p50.map((point, index) => {
        const ts = point[0];
        const p50 = point[1];
        const p10 = entry.p10?.[index]?.[1];
        const p90 = entry.p90?.[index]?.[1];
        return { ts, p50, p10, p90 };
      })
    : [];

  return (
    <div className="min-h-screen bg-primary">
      <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
        {/* Selected asset panel */}
        <div className="col-span-12">
          <div className="gradient-border">
            <div className="flex items-center justify-between rounded-3xl bg-surface-dark px-6 py-4 h-[50px]">
              <div className="text-sm text-ink-tertiary">Selected asset:</div>

              <div className="flex items-baseline gap-3">
                <span className="text-xl font-semibold text-white">
                  {displaySymbol}
                </span>
                <span className="text-lg font-medium text-[#8480C9]">
                  {selectedPrice}
                </span>
              </div>
            </div>
          </div>

          <br />
          <br />
        </div>

        {/* Chart + forecast shape */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-dark rounded-3xl p-6">
            <div className="overflow-x-auto w-[1100px]">
              <div className="flex items-start">
                <div className="flex items-start relative left-0">
                  <YAxis className="h-96 w-full px-6 text-[#8480C9]" />

                  <div className="flex flex-col">
                    <div className="flex">
                      <div className="relative h-96 w-[800px] flex-none">
                        <CandlesChartPlaceholder state={chartState} />
                      </div>

                      <div className="relative h-96 w-[330px] left-0 border-l border-dashed border-[#8480C9] bg-[#1a1738] forecast-shape-panel flex-none">
                        <ForecastShapePlaceholder className="h-96 w-full" />
                      </div>
                    </div>

                    <XAxis
                      width={1130}
                      className="ml-12 h-96 text-[#8480C9]"
                      labels={forecastTimeLabels}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-8" />
        </div>

        <div className="hidden lg:block col-span-4" />

        {/* Params */}
        <div className="col-span-12 lg:col-span-4">
          <ParamsPanel
            state={paramsState}
            onPredict={handleBackToAssets}
            buttonLabel="Back to asset selection"
            selectedModel={entry?.meta.model_ver ?? ''}
            selectedDate={entry?.created_at ?? ''}
            readOnly
          />
        </div>

        <div className="hidden lg:block col-span-1" />

        {/* Factors table */}
        <div className="col-span-12 lg:col-span-7">
          <div className="overflow-x-auto">
            <div className="min-w-[600px] lg:min-w-0">
              <FactorsTable state={factorsState} items={factors} />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-dark rounded-3xl p-6">
            <div className="text-sm text-ink-tertiary">Forecast series</div>
            {entryLoading ? (
              <div className="mt-4 text-ink-tertiary">Loading forecast...</div>
            ) : entry ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-white">
                  <thead>
                    <tr className="text-ink-tertiary">
                      <th className="text-left">Timestamp</th>
                      <th className="text-left">P50</th>
                      <th className="text-left">P10</th>
                      <th className="text-left">P90</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesRows.slice(0, 12).map((row, idx) => (
                      <tr key={`${row.ts}-${idx}`}>
                        <td>{row.ts}</td>
                        <td>{row.p50}</td>
                        <td>{row.p10 ?? '—'}</td>
                        <td>{row.p90 ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 text-ink-tertiary">Forecast not found.</div>
            )}
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
