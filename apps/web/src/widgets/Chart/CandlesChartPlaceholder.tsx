'use client';
import React from 'react';
import Skeleton from '../../shared/ui/Skeleton';

type State = 'idle' | 'loading' | 'empty' | 'ready';

interface CandlesChartPlaceholderProps {
  state: State;
}

export default function CandlesChartPlaceholder({
  state,
}: CandlesChartPlaceholderProps) {
  if (state === 'empty') {
    return <p className="text-gray-500">Select or add asset to view chart</p>;
  }

  if (state === 'loading') {
    // тот же контейнер и габариты, что и у готового блока — без сдвигов
    return (
      <div className="h-93 w-225 absolute left-110 top-52 chart-container rounded skeleton-card--flush">
        <Skeleton width="100%" height="100%" />
      </div>
    );
  }

  return (
    <div className="h-93 w-225 absolute left-110 top-52 chart-container rounded">
      Chart Placeholder
    </div>
  );
}
