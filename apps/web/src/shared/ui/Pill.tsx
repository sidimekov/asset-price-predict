'use client';
import React from 'react';

interface PillProps {
  label: string;
  selected?: boolean;
  variant?: 'asset' | 'add-asset';
  isSkeleton?: boolean; // оставлено на будущее, сейчас Skeleton отдельным компонентом
  onClick?: () => void;
  onRemove?: () => void; // крестик удаления
}

export default function Pill({
  label,
  selected = false,
  variant = 'asset',
  isSkeleton = false, // не используем, но не ломаем API
  onClick,
  onRemove,
}: PillProps) {
  if (variant === 'add-asset') {
    return (
      <button
        className="pill add-asset-pill hover:opacity-90 transition-smooth"
        onClick={onClick}
      >
        + Add Asset
      </button>
    );
  }

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
