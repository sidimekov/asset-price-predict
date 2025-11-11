'use client';

import React from 'react';
import RecentAssetsBar from '../../widgets/recent-assets/RecentAssetsBar';
import CandlesChartPlaceholder from '../../widgets/Chart/CandlesChartPlaceholder';
import ParamsPanel from '../../features/params/ParamsPanel';
import FactorsTable from '../../features/factors/FactorsTable';
import mockAssets from '../../mocks/recentAssets.json';

type State = 'idle' | 'loading' | 'empty' | 'ready';
type ParamsState = 'idle' | 'loading' | 'error' | 'success';

type Asset = { symbol: string; price: string };

export default function Dashboard() {
  const [assets, setAssets] = React.useState<Asset[]>(mockAssets as Asset[]);
  const [selected, setSelected] = React.useState<string | null>(null);

  const [assetState, setAssetState] = React.useState<State>('idle');
  const [paramsState, setParamsState] = React.useState<ParamsState>('idle');
  const [factorsState, setFactorsState] = React.useState<State>('idle');

  // имитируем загрузку API при старте, чтобы увидеть Skeleton
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

  // по умолчанию выбираем первый актив
  React.useEffect(() => {
    if (!selected && assets.length > 0) setSelected(assets[0].symbol);
  }, [assets, selected]);

  // если удалили выбранный — выбираем первый оставшийся
  React.useEffect(() => {
    if (selected && !assets.find((a) => a.symbol === selected)) {
      setSelected(assets[0]?.symbol ?? null);
    }
  }, [assets, selected]);

  const derivedAssetState: State =
    assetState === 'loading' ? 'loading' : assets.length ? 'ready' : 'empty';

  return (
    <div className="absolute h-300 w-370 background text-white p-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Recent Assets */}
        <div className="col-span-12">
          <RecentAssetsBar
            state={derivedAssetState}
            assets={assets}
            selected={selected}
            onSelect={setSelected}
            onRemove={(symbol) =>
              setAssets((prev) => prev.filter((a) => a.symbol !== symbol))
            }
            onAdd={() => {
              // заглушка добавления
              const id = `ASSET${Math.floor(Math.random() * 1000)}`;
              setAssets((prev) => [...prev, { symbol: id, price: '0.00' }]);
            }}
          />
        </div>

        {/* Chart placeholder (график не рисуем) */}
        <div className="col-span-12">
          <CandlesChartPlaceholder state={derivedAssetState} />
        </div>

        {/* Parameters + Factors */}
        <div className="col-span-12 lg:col-span-4">
          <ParamsPanel state={paramsState} />
        </div>

        <div className="col-span-12 lg:col-span-8">
          <FactorsTable state={factorsState} />
        </div>
      </div>
    </div>
  );
}
