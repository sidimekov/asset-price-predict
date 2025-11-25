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
  const baseClasses =
    'chart-container w-full h-96 rounded-3xl flex items-center justify-center';

  if (state === 'empty') {
    return (
      <div className={baseClasses}>
        <p className="text-placeholder">Select or add asset to view chart</p>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className={`${baseClasses} skeleton-card-flush`}>
        <Skeleton width="100%" height="100%" />
      </div>
    );
  }

  return <div className={baseClasses}>Chart Placeholder</div>;
}
