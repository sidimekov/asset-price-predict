'use client';

import React from 'react';
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

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ParamsState = 'idle' | 'loading' | 'error' | 'success';

type RecentBarAsset = {
  symbol: string;
  price: string;
  provider: 'binance' | 'moex';
};

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const recentFromStore = useAppSelector(selectRecent);

  const [assets, setAssets] = React.useState<RecentBarAsset[]>(() => {
    if (recentFromStore.length > 0) {
      return recentFromStore.map((r) => ({
        symbol: r.symbol,
        price: '—',
        provider: r.provider,
      }));
    }
    return (mockAssets as RecentBarAsset[]).map((a) => ({
      ...a,
      provider: a.provider as 'binance' | 'moex',
    }));
  });

  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(
    null,
  );
  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);
  const [modalQuery, setModalQuery] = React.useState('');

  const [assetState, setAssetState] = React.useState<State>('loading');
  const [paramsState, setParamsState] = React.useState<ParamsState>('loading');
  const [factorsState, setFactorsState] = React.useState<State>('loading');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAssetState('ready');
      setParamsState('success');
      setFactorsState('ready');
    }, 1200);

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

  const derivedAssetState: State =
    assetState === 'loading'
      ? 'loading'
      : assets.length > 0
        ? 'ready'
        : 'empty';

  return (
    <>
      <div className="min-h-screen bg-primary">
        <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
          <div className="col-span-12">
            <RecentAssetsBar
              state={derivedAssetState}
              assets={assets}
              selected={selectedSymbol}
              onSelect={setSelectedSymbol}
              onRemove={(symbol) => {
                setAssets((prev) => prev.filter((a) => a.symbol !== symbol));
                if (selectedSymbol === symbol) {
                  setSelectedSymbol(
                    assets.find((a) => a.symbol !== symbol)?.symbol ?? null,
                  );
                }
              }}
              onAdd={() => setIsCatalogOpen(true)}
            />
          </div>

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
              </div>
            </div>
            <div className="h-8" />
          </div>

          <div className="hidden lg:block col-span-4" />

          <div className="col-span-12 lg:col-span-4">
            <ParamsPanel state={paramsState} />
          </div>

          <div className="hidden lg:block col-span-1" />

          <div className="col-span-12 lg:col-span-7">
            <div className="overflow-x-auto">
              <div className="min-w-[600px] lg:min-w-0">
                <FactorsTable state={factorsState} />
              </div>
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
