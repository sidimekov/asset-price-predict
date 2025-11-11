'use client';
import React from 'react'; // Убрали useState, так как он не используется
import Pill from '../../shared/ui/Pill';
import mockAssets from '../../mocks/recentAssets.json'; // Заменили require на import

// Определение типов
type Asset = {
  symbol: string;
  price: string;
};

type State = 'idle' | 'loading' | 'empty' | 'ready';

interface RecentAssetsBarProps {
  state: State;
}

export default function RecentAssetsBar({ state }: RecentAssetsBarProps) {
  const renderContent = () => {
    if (state === 'loading')
      return Array(3)
        .fill(null)
        .map((_, i) => <Pill key={i} isSkeleton />); // Добавлен null для типа
    if (state === 'empty')
      return <p className="text-gray-500">No assets available</p>;

    return (
      <>
        {mockAssets.map((asset: Asset) => (
          <Pill
            key={asset.symbol}
            label={`${asset.symbol} ${asset.price}`}
            variant="unselected"
          />
        ))}
        <Pill label="Add Asset" variant="add-asset" />
      </>
    );
  };

  return (
    <div className="absolute left-92 overflow-x-auto scrollbar-thin mb-4 w-full">
      <p className="text-[#8480C9]">Resent Assets</p>
      <br />
      <div className="flex space-x-2">{renderContent()}</div>
    </div>
  );
}
