'use client';
import React from 'react';

interface YAxisProps {
  width?: number;
  height?: number;
  className?: string;
  values?: number[];
  tickCount?: number;
}

export default function YAxis({
  className = 'h-96 w-full',
  values,
  tickCount = 6,
}: YAxisProps) {
  const fallbackLevels = [
    '6,500',
    '6,000',
    '5,500',
    '5,000',
    '4,500',
    '4,000',
    '3,500',
    '3,000',
    '2,500',
    '2,000',
  ];

  const numericValues = (values ?? []).filter((value) =>
    Number.isFinite(value),
  );

  const labels =
    numericValues.length > 0
      ? (() => {
          const min = Math.min(...numericValues);
          const max = Math.max(...numericValues);
          const steps = Math.max(tickCount - 1, 1);
          const formatter = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2,
          });

          if (min === max) {
            return Array.from({ length: tickCount }, () => formatter.format(min));
          }

          return Array.from({ length: tickCount }, (_, idx) => {
            const value = max - ((max - min) * idx) / steps;
            return formatter.format(value);
          });
        })()
      : fallbackLevels;

  return (
    <div
      className={`flex flex-col items-end justify-between py-6 ${className}`}
    >
      {labels.map((price, index) => (
        <span key={index} className="text-xs text-ink-tertiary">
          {price}
        </span>
      ))}
    </div>
  );
}
