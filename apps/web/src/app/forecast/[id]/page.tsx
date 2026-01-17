'use client';

import React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import CandlesChart from '@/widgets/chart/CandlesChart';
import ForecastShapePlaceholder from '@/widgets/chart/ForecastShapePlaceholder';
import LineChart from '@/widgets/chart/LineChart';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import ParamsPanel from '@/features/params/ParamsPanel';
import FactorsTable from '@/features/factors/FactorsTable';
import type { FactorRow } from '@/features/factors/FactorsTable';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { selectSelectedAsset } from '@/features/asset-catalog/model/catalogSlice';
import {
  selectTimeseriesByKey,
  selectTimeseriesLoadingByKey,
  selectTimeseriesErrorByKey,
} from '@/entities/timeseries/model/timeseriesSlice';
import {
  selectForecastByKey,
  selectForecastLoading,
  selectForecastError,
  selectForecastParams,
} from '@/entities/forecast/model/selectors';
import { setForecastParams } from '@/entities/forecast/model/forecastSlice';
import {
  makeForecastKey,
  makeTimeseriesKey,
} from '@/processes/orchestrator/keys';
import { mapProviderToMarket } from '@/processes/orchestrator/provider';
import type { MarketTimeframe } from '@/config/market';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';
import SegmentedControl from '@/shared/ui/SegmentedControl';

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ChartViewMode = 'line' | 'candles';

const SMALL_TIMEFRAMES = new Set(['1m', '5m', '15m']);
const VIEW_MODE_STORAGE_KEY = 'chart:viewMode';

const isChartViewMode = (value: string | null): value is ChartViewMode =>
  value === 'line' || value === 'candles';

export default function ForecastPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const id = params.id;

  const selectedAsset = useAppSelector(selectSelectedAsset);
  const storedParams = useAppSelector(selectForecastParams);
  const providerNorm = selectedAsset
    ? mapProviderToMarket(selectedAsset.provider)
    : null;
  const [viewMode, setViewMode] = React.useState<ChartViewMode>(() => {
    if (typeof window === 'undefined') return 'line';
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return isChartViewMode(stored) ? stored : 'line';
  });
  const [hasUserSelectedView, setHasUserSelectedView] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return isChartViewMode(window.localStorage.getItem(VIEW_MODE_STORAGE_KEY));
  });

  const defaultParams = React.useMemo(
    () => ({ tf: '1h', window: 200, horizon: 24, model: null }),
    [],
  );

  React.useEffect(() => {
    if (!storedParams) {
      dispatch(setForecastParams(defaultParams));
    }
  }, [dispatch, storedParams, defaultParams]);

  const effectiveParams = storedParams ?? defaultParams;
  const selectedSymbol = selectedAsset?.symbol ?? null;
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
  const forecastError = useAppSelector((state) =>
    fcKey ? selectForecastError(state, fcKey) : null,
  );

  const handleBackToAssets = () => {
    router.push('/dashboard');
  };

  const factors: FactorRow[] =
    forecastEntry?.explain?.map((f) => ({
      name: f.name,
      impact: f.impact !== undefined ? String(f.impact) : undefined,
      shap: f.shap !== undefined ? String(f.shap) : undefined,
      conf: f.conf !== undefined ? `${(f.conf * 100).toFixed(0)}%` : undefined,
    })) ?? [];

  const factorsState: State = forecastLoading
    ? 'loading'
    : forecastError || !forecastEntry?.explain?.length
      ? 'empty'
      : 'ready';

  const seriesRows = forecastEntry
    ? forecastEntry.p50.map((point, index) => {
        const ts = point[0];
        const p50 = point[1];
        const p10 = forecastEntry.p10?.[index]?.[1];
        const p90 = forecastEntry.p90?.[index]?.[1];
        return { ts, p50, p10, p90 };
      })
    : [];

  const chartState: State = !selectedAsset
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

  React.useEffect(() => {
    if (hasUserSelectedView) return;
    const mode = SMALL_TIMEFRAMES.has(String(effectiveParams.tf))
      ? 'candles'
      : 'line';
    setViewMode(mode);
  }, [effectiveParams.tf, hasUserSelectedView]);

  const handleViewModeChange = (mode: ChartViewMode) => {
    setHasUserSelectedView(true);
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    }
  };

  useOrchestrator();

  return (
    <div className="min-h-screen bg-primary">
      {!selectedAsset && !tickerQuery ? (
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
                  values={historyValues}
                />

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex">
                    <div className="relative h-96 flex-1">
                      <div className="absolute right-3 top-3 z-10">
                        <SegmentedControl<ChartViewMode>
                          value={viewMode}
                          options={[
                            { value: 'line', label: 'Line' },
                            { value: 'candles', label: 'Candles' },
                          ]}
                          onChange={handleViewModeChange}
                          size="sm"
                        />
                      </div>
                      {chartState === 'ready' && historySeries ? (
                        viewMode === 'candles' ? (
                          <CandlesChart className="h-96 w-full" bars={bars ?? []} />
                        ) : (
                          <LineChart
                            className="h-96 w-full"
                            series={historySeries}
                          />
                        )
                      ) : barsError ? (
                        <div className="h-96 w-full flex items-center justify-center text-ink-muted">
                          Failed to load history
                        </div>
                      ) : (
                        <CandlesChartPlaceholder state={chartState} />
                      )}
                    </div>

                    <div className="relative h-96 w-[330px] border-l border-dashed border-[#8480C9] bg-[#1a1738] forecast-shape-panel flex-none">
                      <ForecastShapePlaceholder
                        className="h-96 w-full"
                        p50={forecastEntry?.p50}
                        p10={forecastEntry?.p10}
                        p90={forecastEntry?.p90}
                      />
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-1">
                      <XAxis
                        className="text-[#8480C9] w-full"
                        timestamps={historyTimestamps}
                      />
                    </div>
                    <div className="w-[330px]" />
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
