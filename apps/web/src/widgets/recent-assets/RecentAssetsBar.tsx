'use client';
import React from 'react';
import Pill from '../../shared/ui/Pill';

type Asset = {
  symbol: string;
  provider: 'binance' | 'moex' | 'mock';
  lastPrice?: number;
  changePct?: number;
  currency?: 'RUB' | 'USDT' | 'USD';
};
type State = 'idle' | 'loading' | 'empty' | 'ready';

interface RecentAssetsBarProps {
  state: State;
  assets: Asset[];
  selected: string | null;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onAdd: () => void;
}

type PriceFormatRule = { min: number; max: number };

const PRICE_RULES: Record<Asset['provider'], PriceFormatRule> = {
  moex: { min: 1, max: 2 },
  binance: { min: 2, max: 4 },
  mock: { min: 1, max: 2 },
};

function formatWithMinMax(value: number, min: number, max: number): string {
  const fixed = value.toFixed(max);
  if (!fixed.includes('.')) return fixed;
  const [intPart, rawDec] = fixed.split('.');
  let dec = rawDec;
  while (dec.length > min && dec.endsWith('0')) {
    dec = dec.slice(0, -1);
  }
  return `${intPart}.${dec}`;
}

function formatPrice(
  value: number,
  provider: Asset['provider'],
): string {
  const rule = PRICE_RULES[provider];
  return formatWithMinMax(value, rule.min, rule.max);
}

function formatChangePct(changePct: number): string {
  const sign = changePct >= 0 ? '+' : '-';
  const value = Math.abs(changePct).toFixed(1);
  return `${sign}${value}%`;
}

function formatCurrencyLabel(currency?: Asset['currency']): string {
  if (!currency) return '';
  if (currency === 'RUB') return ' ₽';
  return ` ${currency}`;
}

function formatBottomText(asset: Asset): string {
  if (asset.lastPrice == null || !Number.isFinite(asset.lastPrice)) {
    return '—';
  }

  const priceText = formatPrice(asset.lastPrice, asset.provider);
  const currencyText = formatCurrencyLabel(asset.currency);

  if (asset.changePct == null || !Number.isFinite(asset.changePct)) {
    return `${priceText}${currencyText}`;
  }

  return `${priceText}${currencyText} · ${formatChangePct(asset.changePct)}`;
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
      return Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <div className="w-32 h-10 bg-gradient-to-r skeleton-card rounded-full animate-pulse" />
        </div>
      ));
    }

    const assetPills = assets.map((asset) => (
      <Pill
        key={asset.symbol}
        symbol={asset.symbol}
        providerLabel={asset.provider.toUpperCase()}
        bottomText={formatBottomText(asset)}
        selected={asset.symbol === selected}
        onClick={() => onSelect(asset.symbol)}
        onRemove={() => onRemove(asset.symbol)}
      />
    ));

    const addButton = (
      <Pill
        key="add-asset"
        label="+ Add Asset"
        variant="add-asset"
        onClick={onAdd}
      />
    );

    if (assets.length === 0) {
      return (
        <>
          {addButton}
          <span className="text-gray-500 text-sm self-center ml-3">
            No assets
          </span>
        </>
      );
    }
    return [addButton, ...assetPills];
  };

  return (
    <div className="mb-6">
      <p className="text-[#8480C9] text-sm font-medium mb-2">Recent Assets</p>
      <br></br>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 pb-4 min-w-max pl-4">{renderContent()}</div>
      </div>
    </div>
  );
}
