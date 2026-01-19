'use client';

import React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import ForecastShapePlaceholder from '@/widgets/chart/ForecastShapePlaceholder';
import LineChart from '@/widgets/chart/LineChart';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import ParamsPanel from '@/features/params/ParamsPanel';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
  selectSelectedAsset,
  setSelected,
  type Provider,
} from '@/features/asset-catalog/model/catalogSlice';
import {
  selectTimeseriesByKey,
  selectTimeseriesLoadingByKey,
  selectTimeseriesErrorByKey,
} from '@/entities/timeseries/model/timeseriesSlice';
import {
  selectForecastByKey,
  selectForecastLoading,
  selectForecastParams,
} from '@/entities/forecast/model/selectors';
import {
  forecastReceived,
  setForecastParams,
} from '@/entities/forecast/model/forecastSlice';
import type { ForecastEntry } from '@/entities/forecast/types';
import {
  makeForecastKey,
  makeTimeseriesKey,
} from '@/processes/orchestrator/keys';
import { mapProviderToMarket } from '@/processes/orchestrator/provider';
import type { MarketTimeframe } from '@/config/market';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';
import { historyRepository } from '@/entities/history/repository';
import type { HistoryEntry } from '@/entities/history/model';

type State = 'idle' | 'loading' | 'empty' | 'ready';

function mapHistoryToForecastEntry(entry: HistoryEntry): ForecastEntry {
  return {
    p50: entry.p50,
    p10: entry.p10,
    p90: entry.p90,
    explain: entry.explain?.map((item) => ({
      name: item.name,
      impact: item.sign === '-' ? -item.impact_abs : item.impact_abs,
      shap: item.shap,
      conf: item.confidence,
    })),
    meta: {
      runtime_ms: entry.meta.runtime_ms,
      backend: entry.meta.backend,
      model_ver: entry.meta.model_ver ?? 'unknown',
    },
  };
}

export default function ForecastPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const id = params.id;

  const selectedAsset = useAppSelector(selectSelectedAsset);
  const storedParams = useAppSelector(selectForecastParams);
  const providerQuery = searchParams.get('provider');
  const tfQuery = searchParams.get('tf');
  const windowQuery = searchParams.get('window');
  const horizonQuery = searchParams.get('horizon');
  const historyIdQuery = searchParams.get('historyId');
  const providerValue = providerQuery || selectedAsset?.provider || null;
  const providerNorm = providerValue
    ? mapProviderToMarket(providerValue)
    : null;

  const defaultParams = React.useMemo(
    () => ({ tf: '1h', window: 200, horizon: 24, model: 'minimal' }),
    [],
  );

  React.useEffect(() => {
    if (!storedParams) {
      dispatch(setForecastParams(defaultParams));
    }
  }, [dispatch, storedParams, defaultParams]);

  const resolvedParams = React.useMemo(() => {
    const base = storedParams ?? defaultParams;
    const fallbackWindow = base.window ?? defaultParams.window;
    const parsedWindow = windowQuery ? Number(windowQuery) : Number.NaN;
    const safeWindow = Number.isFinite(parsedWindow)
      ? parsedWindow
      : fallbackWindow;
    const fallbackHorizon = base.horizon ?? defaultParams.horizon;
    const parsedHorizon = horizonQuery ? Number(horizonQuery) : Number.NaN;
    const safeHorizon = Number.isFinite(parsedHorizon)
      ? parsedHorizon
      : fallbackHorizon;

    return {
      ...base,
      tf: tfQuery || base.tf,
      window: safeWindow,
      horizon: safeHorizon,
    };
  }, [storedParams, defaultParams, tfQuery, windowQuery, horizonQuery]);

  const effectiveParams = resolvedParams;
  const selectedSymbol = selectedAsset?.symbol ?? String(id);
  const tickerQuery = searchParams.get('ticker');
  const displaySymbol = tickerQuery || selectedSymbol || String(id);
  const selectedPrice = '—';

  const tsKey =
    providerNorm && selectedSymbol
      ? makeTimeseriesKey({
          provider: providerNorm,
          symbol: selectedSymbol,
          tf: effectiveParams.tf as MarketTimeframe,
          window: effectiveParams.window,
        })
      : null;

  const fcKey = selectedSymbol
    ? makeForecastKey({
        symbol: selectedSymbol,
        tf: effectiveParams.tf as MarketTimeframe,
        horizon: effectiveParams.horizon,
        model: effectiveParams.model ?? undefined,
      })
    : null;

  const bars = useAppSelector((state) =>
    tsKey ? selectTimeseriesByKey(state, tsKey as any) : null,
  );
  const barsLoading = useAppSelector((state) =>
    tsKey ? selectTimeseriesLoadingByKey(state, tsKey as any) : false,
  );
  const barsError = useAppSelector((state) =>
    tsKey ? selectTimeseriesErrorByKey(state, tsKey as any) : null,
  );

  const forecastEntry = useAppSelector((state) =>
    fcKey ? selectForecastByKey(state, fcKey) : undefined,
  );
  const forecastLoading = useAppSelector((state) =>
    fcKey ? selectForecastLoading(state, fcKey) : false,
  );

  React.useEffect(() => {
    if (!effectiveParams) return;
    if (
      storedParams?.tf === effectiveParams.tf &&
      storedParams?.window === effectiveParams.window &&
      storedParams?.horizon === effectiveParams.horizon &&
      storedParams?.model === effectiveParams.model
    ) {
      return;
    }
    dispatch(setForecastParams(effectiveParams));
  }, [dispatch, effectiveParams, storedParams]);

  React.useEffect(() => {
    if (!historyIdQuery || !fcKey) return;
    if (forecastEntry) return;
    let isActive = true;

    historyRepository
      .getById(historyIdQuery)
      .then((entry) => {
        if (!isActive || !entry) return;
        dispatch(
          forecastReceived({
            key: fcKey,
            entry: mapHistoryToForecastEntry(entry),
          }),
        );
      })
      .catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[ForecastPage] history load failed', err);
        }
      });

    return () => {
      isActive = false;
    };
  }, [dispatch, fcKey, forecastEntry, historyIdQuery]);

  const handleBackToAssets = () => {
    router.push('/dashboard');
  };

  const seriesRows = forecastEntry
    ? forecastEntry.p50.map((point, index) => {
        const ts = point[0];
        const p50 = point[1];
        const p10 = forecastEntry.p10?.[index]?.[1];
        const p90 = forecastEntry.p90?.[index]?.[1];
        return { ts, p50, p10, p90 };
      })
    : [];

  const chartState: State =
    !providerNorm || !selectedSymbol
      ? 'empty'
      : barsLoading
        ? 'loading'
        : barsError
          ? 'empty'
          : bars && bars.length
            ? 'ready'
            : 'empty';

  const historySeries = bars?.map(
    (bar, index) => [index, bar[4]] as [number, number],
  );
  const historyValues = bars?.map((bar) => bar[4]) ?? [];
  const historyTimestamps = bars?.map((bar) => bar[0]) ?? [];
  const forecastTimestamps = forecastEntry?.p50?.map((point) => point[0]) ?? [];
  const forecastValues = [
    ...(forecastEntry?.p50?.map((point) => point[1]) ?? []),
    ...(forecastEntry?.p10?.map((point) => point[1]) ?? []),
    ...(forecastEntry?.p90?.map((point) => point[1]) ?? []),
  ].filter((value) => Number.isFinite(value));

  const combinedValues = [...historyValues, ...forecastValues].filter((value) =>
    Number.isFinite(value),
  );
  const sharedRange =
    combinedValues.length > 0
      ? {
          min: Math.min(...combinedValues),
          max: Math.max(...combinedValues),
        }
      : undefined;

  const combinedTimestamps = [
    ...historyTimestamps,
    ...forecastTimestamps,
  ].filter((timestamp) => Number.isFinite(timestamp));
  const xAxisTimestamps =
    combinedTimestamps.length > 0 ? combinedTimestamps : undefined;

  const historyCount = historyTimestamps.length;
  const forecastCount = forecastTimestamps.length;
  const historyWeight = historyCount > 0 ? historyCount : 1;
  const forecastWeight = forecastCount > 0 ? forecastCount : 1;
  const chartGridColumns = `${historyWeight}fr ${forecastWeight}fr`;

  React.useEffect(() => {
    if (!selectedAsset && providerValue && selectedSymbol) {
      dispatch(
        setSelected({
          symbol: selectedSymbol,
          provider: providerValue as Provider,
        }),
      );
    }
  }, [dispatch, providerValue, selectedAsset, selectedSymbol]);

  useOrchestrator();

  return (
    <div className="min-h-screen bg-primary">
      {!selectedAsset && !providerValue && !tickerQuery ? (
        <div className="flex flex-col items-center justify-center min-h-screen text-ink-muted">
          <p className="mb-6">Select an asset to view forecast details.</p>
          <button
            className="gradient-button w-60 h-12 rounded text-ink font-medium transition-smooth scale-on-press"
            onClick={handleBackToAssets}
          >
            Back to dashboard
          </button>
        </div>
      ) : (
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
              <div className="flex items-start">
                <YAxis
                  className="h-96 w-auto shrink-0 pr-2 text-[#8480C9]"
                  values={combinedValues}
                />

                <div className="flex min-w-0 flex-1 flex-col">
                  <div
                    className="grid min-w-0"
                    style={{ gridTemplateColumns: chartGridColumns }}
                  >
                    <div className="relative h-96 min-w-0">
                      {chartState === 'ready' && historySeries ? (
                        <LineChart
                          className="h-96 w-full"
                          series={historySeries}
                        />
                      ) : barsError ? (
                        <div className="h-96 w-full flex items-center justify-center text-ink-muted">
                          Failed to load history
                        </div>
                      ) : (
                        <CandlesChartPlaceholder state={chartState} />
                      )}
                    </div>

                    <div className="relative h-96 min-w-[220px] border-l border-dashed border-[#8480C9] bg-[#1a1738] forecast-shape-panel">
                      <ForecastShapePlaceholder
                        className="h-96 w-full"
                        p50={forecastEntry?.p50}
                        p10={forecastEntry?.p10}
                        p90={forecastEntry?.p90}
                        yRange={sharedRange}
                      />
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-1">
                      <XAxis
                        className="text-[#8480C9] w-full"
                        timestamps={xAxisTimestamps}
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
              state="success"
              onPredict={handleBackToAssets}
              buttonLabel="Back to asset selection"
              selectedTimeframe={effectiveParams.tf}
              selectedWindow={effectiveParams.window}
              selectedHorizon={effectiveParams.horizon}
              selectedModel={effectiveParams.model ?? null}
              readOnly
            />
          </div>

          <div className="hidden lg:block col-span-1" />

          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-dark rounded-3xl p-6">
              <div className="text-sm text-ink-tertiary">Forecast series</div>
              {forecastLoading ? (
                <div className="mt-4 text-ink-tertiary">
                  Loading forecast...
                </div>
              ) : forecastEntry ? (
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
                <div className="mt-4 text-ink-tertiary">
                  Forecast not found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
