'use client';
import React from 'react';
import RecentAssetsBar from '@/widgets/recent-assets/RecentAssetsBar';
import CandlesChartPlaceholder from '@/widgets/chart/CandlesChartPlaceholder';
import ParamsPanel from '@/features/params/ParamsPanel';
import FactorsTable from '@/features/factors/FactorsTable';
import XAxis from '@/widgets/chart/coordinates/XAxis';
import YAxis from '@/widgets/chart/coordinates/YAxis';
import mockAssets from '@/mocks/recentAssets.json';
import { useRouter } from 'next/navigation';

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ParamsState = 'idle' | 'loading' | 'error' | 'success';
type Asset = { symbol: string; price: string };

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
  const [selectedDate, setSelectedDate] = React.useState<string>(getTodayDate());

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

  React.useEffect(() => {
    if (!selected && assets.length > 0) {
      setSelected(assets[0].symbol);
    }
  }, [assets, selected]);

  React.useEffect(() => {
    if (selected && !assets.find((a) => a.symbol === selected)) {
      setSelected(assets[0]?.symbol ?? null);
    }
  }, [assets, selected]);

  const derivedAssetState: State =
    assetState === 'loading' ? 'loading' : assets.length ? 'ready' : 'empty';

  const handleAddAsset = () => {
    const id = `ASSET${Math.floor(Math.random() * 1000)}`;
    setAssets((prev) => {
      const updated = [{ symbol: id, price: '0.00' }, ...prev];
      return updated.slice(0, 10);
    });
  };
  const handlePredict = () => {
    if (!selected) return;

    const assetIndex = assets.findIndex((a) => a.symbol === selected);
    if (assetIndex === -1) return;

    const searchParams = new URLSearchParams();

    if (selectedModel) searchParams.set('model', selectedModel);
    if (selectedDate) searchParams.set('to', selectedDate);

    searchParams.set('ticker', selected);

    const query = searchParams.toString();
    const url = `/forecast/${assetIndex}${query ? `?${query}` : ''}`;

    router.push(url);
  };

  const handleRemoveAsset = (symbol: string) => {
    setAssets((prev) => prev.filter((a) => a.symbol !== symbol));
  };

  const visibleAssets = assets.slice(0, 10);

  return (
    <div className="min-h-screen bg-primary">
      <div className="grid grid-cols-12 gap-6 px-8 pt-8 pb-32">
        {/* Recent Assets — 12 колонок */}
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

        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-dark rounded-3xl p-6">
            <div className="flex items-start">
              <YAxis className="h-96 w-full px-6 text-[#8480C9]" />

              <div className="flex-1 flex flex-col">
                <div className="flex-1 relative">
                  <CandlesChartPlaceholder state={derivedAssetState} />
                </div>

                <XAxis className="ml-12 h-96 w-full text-[#8480C9]" />
              </div>
            </div>
          </div>

          <div className="h-8" />
        </div>

        <div className="hidden lg:block col-span-4" />

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

        <div className="col-span-12 lg:col-span-7">
          <div className="overflow-x-auto">
            <div className="min-w-[600px] lg:min-w-0">
              <FactorsTable state={factorsState} />
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
