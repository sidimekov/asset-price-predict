'use client';
import React from 'react';

interface PillProps {
  variant?: 'asset' | 'add-asset';
  selected?: boolean;
  isSkeleton?: boolean;
  symbol?: string;
  providerLabel?: string;
  bottomText?: string;
  label?: string;
  onClick?: () => void;
  onRemove?: () => void; // крестик удаления
}

export default function Pill({
  selected = false,
  variant = 'asset',
  isSkeleton = false,
  symbol,
  providerLabel,
  bottomText,
  label,
  onClick,
  onRemove,
}: PillProps) {
  if (variant === 'add-asset') {
    return (
      <button
        className="pill add-asset-pill hover:opacity-90 transition-smooth"
        onClick={onClick}
      >
        {label ?? '+ Add Asset'}
      </button>
    );
  }

  if (!symbol && !providerLabel && !bottomText && label) {
    return (
      <button
        className={`pill relative transition-smooth ${
          selected ? 'selected-pill' : 'unselected-pill'
        }`}
        onClick={onClick}
      >
        {label}

        {onRemove && (
          <span
            role="button"
            aria-label="remove"
            className="pill-close"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            ×
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      className={`pill pill-asset relative transition-smooth ${
        selected ? 'selected-pill' : 'unselected-pill'
      }`}
      onClick={onClick}
    >
      <span className="pill-top">
        <span className="pill-symbol">{symbol ?? label ?? ''}</span>
        {providerLabel && (
          <span className="pill-provider">{providerLabel}</span>
        )}
      </span>
      {bottomText && <span className="pill-bottom">{bottomText}</span>}

      {onRemove && (
        <span
          role="button"
          aria-label="remove"
          className="pill-close"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </span>
      )}
    </button>
  );
}
