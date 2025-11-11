'use client';
import React from 'react';
import Pill from '../../shared/ui/Pill';
import Skeleton from '../../shared/ui/Skeleton';

type Asset = { symbol: string; price: string };
type State = 'idle' | 'loading' | 'empty' | 'ready';

interface RecentAssetsBarProps {
  state: State;
  assets: Asset[];
  selected: string | null;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onAdd: () => void;
}

export default function RecentAssetsBar({
  state,
  assets,
  selected,
  onSelect,
  onRemove,
  onAdd,
}: RecentAssetsBarProps) {
  const renderContent = () => {
    if (state === 'loading') {
      // карточки-скелетоны той же формы и размера, что и реальные pill
      return Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-card skeleton-pill-wrapper">
          <Skeleton width="100%" height="100%" />
        </div>
      ));
    }

    if (state === 'empty')
      return <p className="text-gray-500">No assets available</p>;

    return (
      <>
        {assets.map((asset) => (
          <Pill
            key={asset.symbol}
            label={`${asset.symbol} ${asset.price}`}
            selected={asset.symbol === selected}
            onClick={() => onSelect(asset.symbol)}
            onRemove={() => onRemove(asset.symbol)}
          />
        ))}
        <Pill label="+ Add Asset" variant="add-asset" onClick={onAdd} />
      </>
    );
  };

  return (
    <div className="absolute left-92 overflow-x-auto mb-4 w-full">
      {/* вертикальный зазор между заголовком и пиллами */}
      <div className="flex flex-col gap-3">
        <p className="text-[#8480C9]">Recent Assets</p>
        <div className="flex gap-3 pr-2">{renderContent()}</div>
      </div>
    </div>
  );
}
