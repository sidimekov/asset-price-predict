'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import RecentAssetsBar from '@/widgets/recent-assets/RecentAssetsBar';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import ParamsPanel from '@/features/params/ParamsPanel';
import FactorsTable from '@/features/factors/FactorsTable';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import { AssetCatalogPanel } from '@/features/asset-catalog/ui/AssetCatalogPanel';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
  addRecent,
  setSelected,
  selectRecent,
} from '@/features/asset-catalog/model/catalogSlice';
import {
  timeseriesRequested,
  buildTimeseriesKey,
} from '@/entities/timeseries/model/timeseriesSlice';
import { DEFAULT_TIMEFRAME } from '@/config/market';
import mockAssets from '@/mocks/recentAssets.json';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ParamsState = 'idle' | 'loading' | 'error' | 'success';

type RecentBarAsset = {
  symbol: string;
  price: string;
  provider: 'binance' | 'moex';
};

export default function Dashboard() {
  const router = useRouter();

  const [assets, setAssets] = React.useState<Asset[]>(mockAssets as Asset[]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [assetState, setAssetState] = React.useState<State>('idle');

  const [paramsState, setParamsState] = React.useState<ParamsState>('idle');
  const [factorsState, setFactorsState] = React.useState<State>('idle');

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedModel, setSelectedModel] = React.useState<string>('');
  const [selectedDate, setSelectedDate] =
    React.useState<string>(getTodayDate());

  React.useEffect(() => {
    setAssetState('loading');
    setParamsState('loading');
    setFactorsState('loading');

    const t = setTimeout(() => {
      setAssetState('ready');
      setParamsState('success');
      setFactorsState('ready');
    }, 1200);

    return () => clearTimeout(t);
  }, []);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!selectedSymbol && assets.length > 0) {
      setSelectedSymbol(assets[0].symbol);
    }
  }, [assets, selectedSymbol]);

  const handleAssetSelect = ({
    symbol,
    provider,
  }: {
    symbol: string;
    provider: 'binance' | 'moex';
  }) => {
    dispatch(addRecent({ symbol, provider }));
    dispatch(setSelected({ symbol, provider }));

    setAssets((prev) => {
      const exists = prev.some(
        (a) => a.symbol === symbol && a.provider === provider,
      );
      if (exists) {
        return prev.map((a) =>
          a.symbol === symbol && a.provider === provider
            ? { ...a, price: '—' }
            : a,
        );
      }
      return [
        { symbol, price: '—', provider },
        ...prev.filter(
          (a) => !(a.symbol === symbol && a.provider === provider),
        ),
      ].slice(0, 10);
    });

    setSelectedSymbol(symbol);
    const key = buildTimeseriesKey(
      provider.toUpperCase() as 'BINANCE' | 'MOEX',
      symbol,
      DEFAULT_TIMEFRAME,
    );
    dispatch(timeseriesRequested({ key }));

    setIsCatalogOpen(false);
    setModalQuery('');
  };

  const handlePredict = () => {
    if (!selected) return;

    const assetIndex = assets.findIndex((a) => a.symbol === selected);
    const id = assetIndex === -1 ? 0 : assetIndex;

    const queryParts: string[] = [`ticker=${encodeURIComponent(selected)}`];

    if (selectedModel) {
      queryParts.push(`model=${encodeURIComponent(selectedModel)}`);
    }
    if (selectedDate) {
      queryParts.push(`to=${encodeURIComponent(selectedDate)}`);
    }

    const query = queryParts.length ? `?${queryParts.join('&')}` : '';
    router.push(`/forecast/${id}${query}`);
  };

  const visibleAssets = assets.slice(0, 10);

  useOrchestrator();

  return (
    <div className="min-h-screen bg-primary">
      <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
        {/* Recent assets */}
        <div className="col-span-12">
          <RecentAssetsBar
            state={derivedAssetState}
            assets={visibleAssets}
            selected={selected}
            onSelect={setSelected}
            onRemove={handleRemoveAsset}
            onAdd={handleAddAsset}
          />
        </div>

        {/* Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-dark rounded-3xl p-6">
            <div className="flex items-start">
              <YAxis className="h-96 w-full px-6 text-[#8480C9]" />

          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-dark rounded-3xl p-6">
              <div className="flex items-start">
                <YAxis className="h-96 w-full px-6" />
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 relative">
                    <CandlesChartPlaceholder state={derivedAssetState} />
                  </div>
                  <XAxis className="ml-12 h-96 w-full" />
                </div>

                <XAxis className="ml-12 h-96 w-full text-[#8480C9]" />
              </div>
            </div>
            <div className="h-8" />
          </div>

          <div className="hidden lg:block col-span-4" />

        {/* Params */}
        <div className="col-span-12 lg:col-span-4">
          <ParamsPanel
            state={paramsState}
            onPredict={handlePredict}
            selectedModel={selectedModel}
            selectedDate={selectedDate}
            onModelChange={setSelectedModel}
            onDateChange={setSelectedDate}
          />
        </div>

          <div className="hidden lg:block col-span-1" />

        {/* Factors */}
        <div className="col-span-12 lg:col-span-7">
          <div className="overflow-x-auto">
            <div className="min-w-[600px] lg:min-w-0">
              <FactorsTable state={factorsState} />
            </div>
          </div>
        </div>
      </div>

      {isCatalogOpen && (
        <>
          <div
            className="fixed inset-0 z-[1050] bg-[rgba(32,29,71,0.75)] backdrop-blur-xs transition-all duration-300"
            onClick={() => setIsCatalogOpen(true)}
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
    </>
  );
}
