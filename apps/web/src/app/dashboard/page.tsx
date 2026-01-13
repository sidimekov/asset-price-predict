'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import RecentAssetsBar from '@/widgets/recent-assets/RecentAssetsBar';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import LineChart from '@/widgets/chart/LineChart';
import ParamsPanel from '@/features/params/ParamsPanel';
import FactorsTable from '@/features/factors/FactorsTable';
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
  selectTimeseriesByKey,
  selectTimeseriesLoadingByKey,
  selectTimeseriesErrorByKey,
} from '@/entities/timeseries/model/timeseriesSlice';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';
import { setForecastParams } from '@/entities/forecast/model/forecastSlice';
import {
  selectForecastByKey,
  selectForecastLoading,
  selectForecastError,
  selectForecastParams,
} from '@/entities/forecast/model/selectors';
import { makeForecastKey, makeTimeseriesKey } from '@/processes/orchestrator/keys';
import { mapProviderToMarket } from '@/processes/orchestrator/provider';
import type { MarketTimeframe } from '@/config/market';

type State = 'idle' | 'loading' | 'empty' | 'ready';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const recentAssets = useAppSelector(selectRecent);
  const selectedAsset = useAppSelector(selectSelectedAsset);
  const params = useAppSelector(selectForecastParams);

  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);
  const [modalQuery, setModalQuery] = React.useState('');

  const selectedSymbol = selectedAsset?.symbol ?? null;
  const providerNorm = selectedAsset
    ? mapProviderToMarket(selectedAsset.provider)
    : null;

  const defaultParams = React.useMemo(
    () => ({ tf: '1h', window: 200, horizon: 24, model: null }),
    [],
  );

  React.useEffect(() => {
    if (!params) {
      dispatch(setForecastParams(defaultParams));
    }
  }, [dispatch, params, defaultParams]);

  const effectiveParams = params ?? defaultParams;

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

  const derivedAssetState: State = !selectedSymbol
    ? 'empty'
    : recentAssets.length === 0
      ? 'empty'
      : 'ready';

  const handleAssetSelect = ({
    symbol,
    provider,
  }: {
    symbol: string;
    provider: 'binance' | 'moex';
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
    router.push(`/forecast/${encodeURIComponent(selectedAsset.symbol)}`);
  };

  const handleRemoveAsset = (symbol: string, provider?: string) => {
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

  const historySeries = bars?.map((bar, index) => [index, bar[4]] as [number, number]);
  const historyValues = bars?.map((bar) => bar[4]) ?? [];
  const historyTimestamps = bars?.map((bar) => bar[0]) ?? [];

  const factors =
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

  return (
    <div className="min-h-screen bg-primary">
      <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
        {/* Recent assets */}
        <div className="col-span-12">
          <RecentAssetsBar
            state={derivedAssetState}
            assets={recentAssets.map((a) => ({
              symbol: a.symbol,
              price: '—', // Цена остается "—" как в оригинале
              provider: a.provider,
            }))}
            selected={selectedSymbol}
            onSelect={handleRecentSelect}
            onRemove={handleRemoveAsset}
            onAdd={() => setIsCatalogOpen(true)}
          />
        </div>

        {/* Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-dark rounded-3xl p-6">
            <div className="flex items-start">
              <YAxis
                className="h-96 w-auto shrink-0 pr-2 text-[#8480C9]"
                values={historyValues}
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex">
                  <div className="relative h-96 w-full">
                    {chartState === 'ready' && historySeries ? (
                      <LineChart className="h-96 w-full" series={historySeries} />
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
                  timestamps={historyTimestamps}
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

        <div className="hidden lg:block col-span-1" />

        {/* Factors */}
        <div className="col-span-12 lg:col-span-7">
          <div className="overflow-x-auto">
            <div className="min-w-[600px] lg:min-w-0">
              <FactorsTable state={factorsState} items={factors} />
            </div>
          </div>
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
