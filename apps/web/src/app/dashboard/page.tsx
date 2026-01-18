'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import RecentAssetsBar from '@/widgets/recent-assets/RecentAssetsBar';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import ParamsPanel from '@/features/params/ParamsPanel';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import { AssetCatalogPanel } from '@/features/asset-catalog/ui/AssetCatalogPanel';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { predictRequested } from '@/entities/forecast/model/forecastSlice';
import {
  addRecent,
  setSelected,
  removeRecent,
  selectRecent,
  selectSelectedAsset,
} from '@/features/asset-catalog/model/catalogSlice';
import { useOrchestrator } from '@/processes/orchestrator/useOrchestrator';
import { track } from '@/shared/analytics';
import { AnalyticsEvent } from '@/shared/analytics/events';

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ParamsState = 'idle' | 'loading' | 'error' | 'success';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const recentAssets = useAppSelector(selectRecent);
  const selectedAsset = useAppSelector(selectSelectedAsset);

  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);
  const [modalQuery, setModalQuery] = React.useState('');
  const [paramsState, setParamsState] = React.useState<ParamsState>('idle');

  const [selectedModel, setSelectedModel] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(today.getDate()).padStart(2, '0')}`;
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setParamsState('success');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const selectedSymbol = selectedAsset?.symbol ?? null;

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
    provider: 'binance' | 'moex' | 'mock';
  }) => {
    dispatch(addRecent({ symbol, provider }));
    dispatch(setSelected({ symbol, provider }));

    setIsCatalogOpen(false);
    setModalQuery('');
  };

  const handlePredict = () => {
    if (!selectedAsset?.symbol || !selectedAsset?.provider) return;

    track(AnalyticsEvent.PREDICT_START, {
      symbol: selectedAsset.symbol,
      provider: selectedAsset.provider,
      tf: '1h',
      window: 200,
      horizon: 24,
      model: selectedModel || null,
    });

    dispatch(
      predictRequested({
        symbol: selectedAsset.symbol,
        provider: selectedAsset.provider,
        tf: '1h',
        window: 200,
        horizon: 24,
        model: selectedModel || null,
      }),
    );

    // Переход на forecast страницу — оставляем как было
    const parts = [`ticker=${encodeURIComponent(selectedAsset.symbol)}`];
    if (selectedModel) parts.push(`model=${encodeURIComponent(selectedModel)}`);
    if (selectedDate) parts.push(`to=${encodeURIComponent(selectedDate)}`);

    const query = parts.length > 0 ? `?${parts.join('&')}` : '';
    router.push(`/forecast/0${query}`);
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
      dispatch(setSelected({ symbol: asset.symbol, provider: asset.provider }));
    }
  };

  useOrchestrator();

  return (
    <div className="min-h-screen bg-primary">
      <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
        {/* Recent assets */}
        <div className="col-span-12">
          <RecentAssetsBar
            state={derivedAssetState}
            assets={recentAssets.map((a) => ({
              symbol: a.symbol,
              price: '—',
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
              <YAxis className="h-96 w-full px-6 text-[#8480C9]" />

              <div className="flex flex-col">
                <div className="flex">
                  <div className="relative h-96 w-[800px] flex-none">
                    <CandlesChartPlaceholder state={derivedAssetState} />
                  </div>
                </div>

                <XAxis className="text-[#8480C9]" />
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
            onPredict={handlePredict}
            selectedModel={selectedModel}
            selectedDate={selectedDate}
            onModelChange={setSelectedModel}
            onDateChange={setSelectedDate}
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
