'use client';
import React from 'react';
import Skeleton from '@/shared/ui/Skeleton';

type State = 'idle' | 'loading' | 'empty' | 'ready';

interface CandlesChartPlaceholderProps {
  state: State;
}

export default function CandlesChartPlaceholder({
  state,
}: CandlesChartPlaceholderProps) {
  if (state === 'empty') {
    return (
      <div className="h-96 flex items-center justify-center text-ink-muted bg-surface-dark rounded-3xl">
        Select or add asset to view chart
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="h-96 w-full rounded-3xl overflow-hidden bg-surface-dark shadow-card">
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-ink text-lg">Uploading data...</p>
          <div className="w-12 h-12 border-4 border-t-transparent border-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-3xl chart-container shadow-card-elevated flex items-center justify-center">
      <p className="text-ink text-xl font-medium">Chart Placeholder</p>
    </div>
  );
}
