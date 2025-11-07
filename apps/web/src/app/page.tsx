// apps/web/src/app/page.tsx
'use client';

import React, { useState } from 'react';
import RecentAssetsBar from '../widgets/recent-assets/RecentAssetsBar';
import CandlesChartPlaceholder from '../widgets/Chart/CandlesChartPlaceholder';
import ParamsPanel from '../features/params/ParamsPanel';
import FactorsTable from '../features/factors/FactorsTable';

// Определение типов
type State = 'idle' | 'loading' | 'empty' | 'ready';
type ParamsState = 'idle' | 'loading'| 'error' | 'success';

export default function Dashboard() {
  const [assetState, setAssetState] = useState<State>('idle'); // Начальное состояние: ничего не выбрано
  const [paramsState, setParamsState] = useState<ParamsState>('idle'); // Начальное состояние: параметры не загружены
  const [factorsState, setFactorsState] = useState<State>('idle'); // Начальное состояние: факторы не загружены

  // Получение текущей даты для отображения (опционально)
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
      <div className="absolute h-300 w-370 background text-white p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Recent Assets Bar */}
          <div className="col-span-12">
            <RecentAssetsBar state={assetState} />
          </div>

          {/* Chart Area */}
          <div className="col-span-12">
            <CandlesChartPlaceholder state={assetState} />
          </div>

          {/* Parameters and Factors */}
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