'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import RecentAssetsBar from '@/widgets/recent-assets/RecentAssetsBar';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import CandlesChart from '@/widgets/chart/CandlesChart';
import LineChart from '@/widgets/chart/LineChart';
import ParamsPanel from '@/features/params/ParamsPanel';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import { AssetCatalogPanel } from '@/features/asset-catalog/ui/AssetCatalogPanel';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
  addRecent,
  setSelected,
  removeRecent,
  selectRecent,
  selectSelectedAsset,
} from '@/features/asset-catalog/model/catalogSlice';
import {
  forecastPredictRequested,
  setForecastParams,
} from '@/entities/forecast/model/forecastSlice';
import { selectForecastParams } from '@/entities/forecast/model/selectors';
import {
  selectTimeseriesByKey,
  selectTimeseriesLoadingByKey,
  selectTimeseriesErrorByKey,
} from '@/entities/timeseries/model/timeseriesSlice';
import { selectPriceChangeByAsset } from '@/entities/timeseries/model/selectors';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';
import { makeTimeseriesKey } from '@/processes/orchestrator/keys';
import { mapProviderToMarket } from '@/processes/orchestrator/provider';
import SegmentedControl from '@/shared/ui/SegmentedControl';
import {
  DEFAULT_LIMIT,
  DEFAULT_TIMEFRAME,
  type MarketTimeframe,
} from '@/config/market';

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ChartViewMode = 'line' | 'candles';

const SMALL_TIMEFRAMES = new Set(['1m', '5m', '15m']);
const DEFAULT_WINDOW = 200;
const VIEW_MODE_STORAGE_KEY = 'chart:viewMode';

const isChartViewMode = (value: string | null): value is ChartViewMode =>
  value === 'line' || value === 'candles';

const resolveCurrency = (
  provider: 'binance' | 'moex' | 'mock',
  symbol: string,
): 'RUB' | 'USDT' | 'USD' | undefined => {
  if (provider === 'moex') return 'RUB';
  if (provider === 'binance' && symbol.toUpperCase().endsWith('USDT')) {
    return 'USDT';
  }
  return undefined;
};

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const recentAssets = useAppSelector(selectRecent);
  const selectedAsset = useAppSelector(selectSelectedAsset);
  const params = useAppSelector(selectForecastParams);

  const rawWindow = params?.window;
  const windowNum = typeof rawWindow === 'string' ? Number(rawWindow) : rawWindow;
  const timeseriesWindow =
    Number.isFinite(windowNum) && windowNum && windowNum > 0
      ? windowNum
      : process.env.NODE_ENV !== 'production'
        ? 200
        : DEFAULT_LIMIT;

  const recentAssetsWithStats = useAppSelector((state) =>
    recentAssets.map((asset) => {
      const providerNorm = mapProviderToMarket(asset.provider) ?? 'MOCK';
      const stats = selectPriceChangeByAsset(
        state,
        providerNorm,
        asset.symbol,
        DEFAULT_TIMEFRAME,
        timeseriesWindow,
      );
      return {
        symbol: asset.symbol,
        provider: asset.provider,
        lastPrice: stats.lastPrice,
        changePct: stats.changePct,
        currency: resolveCurrency(asset.provider, asset.symbol),
      };
    }),
  );

  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);
  const [modalQuery, setModalQuery] = React.useState('');

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
    () => ({ tf: DEFAULT_TIMEFRAME, window: 200, horizon: 24, model: null }),
    [],
  );

  React.useEffect(() => {
    if (!params) {
      dispatch(setForecastParams(defaultParams));
    }
  }, [dispatch, params, defaultParams]);

  const effectiveParams = params ?? defaultParams;
  const effectiveTf = effectiveParams.tf as MarketTimeframe;
  const effectiveWindowRaw = effectiveParams.window;
  const effectiveWindow =
    typeof effectiveWindowRaw === 'number'
      ? effectiveWindowRaw
      : Number(effectiveWindowRaw ?? DEFAULT_WINDOW) || DEFAULT_WINDOW;

  const selectedSymbol = selectedAsset?.symbol ?? null;
  const providerNorm = selectedAsset
    ? mapProviderToMarket(selectedAsset.provider)
    : null;

  const tsKey =
    providerNorm && selectedSymbol
      ? makeTimeseriesKey({
          provider: providerNorm,
          symbol: selectedSymbol,
          tf: effectiveTf,
          window: effectiveWindow,
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

  const derivedAssetState: State = !selectedSymbol
    ? 'empty'
    : recentAssets.length === 0
      ? 'empty'
      : 'ready';

  React.useEffect(() => {
    if (hasUserSelectedView) return;
    const mode = SMALL_TIMEFRAMES.has(String(effectiveTf)) ? 'candles' : 'line';
    setViewMode(mode);
  }, [effectiveTf, hasUserSelectedView]);

  const handleViewModeChange = (mode: ChartViewMode) => {
    setHasUserSelectedView(true);
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    }
  };

  const handleAssetSelect = ({
    symbol,
    provider,
  }: {
    symbol: string;
    provider: 'binance' | 'moex' | 'mock';
  }) => {
    dispatch(addRecent({ symbol, provider }));
    dispatch(setSelected({ symbol, provider }));

    setIsCatalogOpen(false);
    setModalQuery('');
  };

  const handlePredict = () => {
    if (!selectedSymbol || !selectedAsset) return;
    dispatch(setSelected(selectedAsset));
    dispatch(setForecastParams(effectiveParams));
    dispatch(
      forecastPredictRequested({
        symbol: selectedAsset.symbol,
        provider: selectedAsset.provider,
        tf: effectiveParams.tf,
        window: effectiveParams.window,
        horizon: effectiveParams.horizon,
        model: effectiveParams.model ?? null,
      }),
    );
    const query = new URLSearchParams({
      provider: selectedAsset.provider,
      tf: String(effectiveParams.tf),
      window: String(effectiveParams.window),
    });
    router.push(`/forecast/${encodeURIComponent(selectedAsset.symbol)}?${query}`);
  };

  const handleRemoveAsset = (symbol: string) => {
    const asset = recentAssets.find((a) => a.symbol === symbol);
    if (asset) {
      dispatch(
        removeRecent({
          symbol: asset.symbol,
          provider: asset.provider,
        }),
      );
    }
  };

  const handleRecentSelect = (symbol: string) => {
    const asset = recentAssets.find((a) => a.symbol === symbol);
    if (asset) {
      dispatch(setSelected(asset));
    }
  };

  useOrchestrator();

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
    (bar) => [bar[0], bar[4]] as [number, number],
  );
  const historyValues = bars?.map((bar) => bar[4]) ?? [];
  const historyTimestamps = bars?.map((bar) => bar[0]) ?? [];

  return (
    <div className="min-h-screen bg-primary">
      <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
        {/* Recent assets */}
        <div className="col-span-12">
          <RecentAssetsBar
            state={derivedAssetState}
            assets={recentAssetsWithStats}
            selected={selectedSymbol}
            onSelect={handleRecentSelect}
            onRemove={handleRemoveAsset}
            onAdd={() => setIsCatalogOpen(true)}
          />
        </div>

        {/* Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-dark rounded-3xl p-6 relative">
            <div className="absolute right-6 top-6">
              <SegmentedControl<ChartViewMode>
                value={viewMode}
                options={[
                  { value: 'line', label: 'Line' },
                  { value: 'candles', label: 'Candles' },
                ]}
                onChange={handleViewModeChange}
              />
            </div>
            <div className="flex items-start">
              <YAxis
                className="h-96 w-auto shrink-0 pr-2 text-[#8480C9]"
                values={historyValues}
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex">
                  <div className="relative h-96 w-full">
                    {chartState === 'ready' && historySeries ? (
                      viewMode === 'candles' ? (
                        <CandlesChart
                          bars={bars ?? []}
                          className="h-96 w-full"
                        />
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
                </div>

                <XAxis
                  className="text-[#8480C9]"
                  timestamps={
                    historyTimestamps.length > 0 ? historyTimestamps : undefined
                  }
                />
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
            onPredict={handlePredict}
            selectedTimeframe={effectiveParams.tf}
            selectedWindow={effectiveParams.window}
            selectedHorizon={effectiveParams.horizon}
            selectedModel={effectiveParams.model ?? null}
            onTimeframeChange={(tf) =>
              dispatch(
                setForecastParams({
                  ...effectiveParams,
                  tf,
                }),
              )
            }
            onWindowChange={(window) =>
              dispatch(
                setForecastParams({
                  ...effectiveParams,
                  window,
                }),
              )
            }
            onHorizonChange={(horizon) =>
              dispatch(
                setForecastParams({
                  ...effectiveParams,
                  horizon,
                }),
              )
            }
            onModelChange={(model) =>
              dispatch(
                setForecastParams({
                  ...effectiveParams,
                  model,
                }),
              )
            }
          />
        </div>
      </div>

      {/* Asset Catalog Modal */}
      {isCatalogOpen && (
        <>
          <div
            className="fixed inset-0 z-[1050] bg-[rgba(32,29,71,0.75)] backdrop-blur-xs transition-all duration-300"
            onClick={() => setIsCatalogOpen(false)}
          />

          <div className="fixed inset-0 z-[1100] flex items-center justify-center pointer-events-none">
            <div
              className="find-assets-card pointer-events-auto animate-in fade-in zoom-in-95 duration-400 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="find-assets-close-button"
                aria-label="Close"
              >
                ×
              </button>

              <AssetCatalogPanel
                query={modalQuery}
                onQueryChange={setModalQuery}
                onSelect={handleAssetSelect}
                onClose={() => setIsCatalogOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
