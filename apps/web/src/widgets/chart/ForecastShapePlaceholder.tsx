'use client';

import React from 'react';
import type { ForecastSeries } from '@/entities/forecast/types';

type ForecastShapePlaceholderProps = {
  className?: string;
  p50?: ForecastSeries;
  p10?: ForecastSeries;
  p90?: ForecastSeries;
};

function toValues(series?: ForecastSeries): number[] {
  return series?.map((point) => point[1]) ?? [];
}

export default function ForecastShapePlaceholder({
  className,
  p50,
  p10,
  p90,
}: ForecastShapePlaceholderProps) {
  const series = p50 ?? [];

  if (series.length < 2) {
    return (
      <div className={className}>
        <div className="h-96 w-full flex items-center justify-center">
          <span className="text-xs text-ink-muted">Forecast shape</span>
        </div>
      </div>
    );
  }

  const values = [
    ...toValues(p50),
    ...toValues(p10),
    ...toValues(p90),
  ].filter((v) => Number.isFinite(v));

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const width = 100;
  const height = 100;

  const valueToY = (v: number) => {
    const t = maxVal === minVal ? 0.5 : (v - minVal) / (maxVal - minVal);
    return height - t * height;
  };

  const n = series.length;
  const stepX = width / (n - 1);

  const valueLine = series
    .map((point, i) => {
      const x = i * stepX;
      const y = valueToY(point[1]);
      return `${x},${y}`;
    })
    .join(' ');

  const hasBand =
    p10 && p90 && p10.length === series.length && p90.length === series.length;

  const upper = hasBand
    ? p90!
        .map((point, i) => {
          const x = i * stepX;
          const y = valueToY(point[1]);
          return `${x},${y}`;
        })
        .join(' ')
    : '';

  const lower = hasBand
    ? [...p10!]
        .reverse()
        .map((point, idx) => {
          const i = n - 1 - idx;
          const x = i * stepX;
          const y = valueToY(point[1]);
          return `${x},${y}`;
        })
        .join(' ')
    : '';

  const polygonPoints = hasBand ? `${upper} ${lower}` : '';

  return (
    <div className={className}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id="forecast-fill" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#ff409a" />
            <stop offset="100%" stopColor="#c438ef" />
          </radialGradient>
        </defs>

        {hasBand && (
          <polygon
            points={polygonPoints}
            fill="url(#forecast-fill)"
            opacity={0.95}
          />
        )}

        <polyline
          points={valueLine}
          fill="none"
          stroke="#FFBFF6"
          strokeWidth={0.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
