'use client';

import React from 'react';
import type { ForecastSeries } from '@/entities/forecast/types';

type ForecastShapePlaceholderProps = {
  className?: string;
  p50?: ForecastSeries;
  p10?: ForecastSeries;
  p90?: ForecastSeries;
  yRange?: {
    min: number;
    max: number;
  };
};

function toValues(series?: ForecastSeries): number[] {
  return series?.map((point) => point[1]) ?? [];
}

export default function ForecastShapePlaceholder({
  className,
  p50,
  p10,
  p90,
  yRange,
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

  const values = [...toValues(p50), ...toValues(p10), ...toValues(p90)].filter(
    (v) => Number.isFinite(v),
  );

  const fallbackMin = Math.min(...values);
  const fallbackMax = Math.max(...values);
  const rangeMin =
    yRange && Number.isFinite(yRange.min) ? yRange.min : fallbackMin;
  const rangeMax =
    yRange && Number.isFinite(yRange.max) ? yRange.max : fallbackMax;

  const width = 100;
  const height = 100;

  const valueToY = (v: number) => {
    const t =
      rangeMax === rangeMin ? 0.5 : (v - rangeMin) / (rangeMax - rangeMin);
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
