'use client';

import React from 'react';
import forecastDetail from '@/mocks/forecast-detail.json';

type ForecastShapePlaceholderProps = {
  className?: string;
};

type ForecastPoint = {
  time: string;
  value: number;
  low: number;
  high: number;
};

type ForecastSeries = {
  symbol: string;
  horizon: string;
  timeframe: string;
  points: ForecastPoint[];
};

export default function ForecastShapePlaceholder({
  className,
}: ForecastShapePlaceholderProps) {
  const series = (forecastDetail as ForecastSeries[])[0];

  if (!series || !series.points || series.points.length < 2) {
    return (
      <div className={className}>
        <div className="h-96 w-full flex items-center justify-center">
          <span className="text-xs text-ink-muted">Forecast shape</span>
        </div>
      </div>
    );
  }

  const points = series.points;

  const minLow = Math.min(...points.map((p) => p.low));
  const maxHigh = Math.max(...points.map((p) => p.high));

  // без внутренних отступов — используем всю область
  const paddingX = 0;
  const paddingY = 0;
  const width = 100;
  const height = 100;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const valueToY = (v: number) => {
    const t = maxHigh === minLow ? 0.5 : (v - minLow) / (maxHigh - minLow);
    return height - paddingY - t * usableHeight;
  };

  const n = points.length;
  const stepX = usableWidth / (n - 1);

  const valueLine = points
    .map((p, i) => {
      const x = paddingX + i * stepX;
      const y = valueToY(p.value);
      return `${x},${y}`;
    })
    .join(' ');

  const upper = points
    .map((p, i) => {
      const x = paddingX + i * stepX;
      const y = valueToY(p.high);
      return `${x},${y}`;
    })
    .join(' ');

  const lower = [...points]
    .reverse()
    .map((p, idx) => {
      const i = n - 1 - idx;
      const x = paddingX + i * stepX;
      const y = valueToY(p.low);
      return `${x},${y}`;
    })
    .join(' ');

  const polygonPoints = `${upper} ${lower}`;

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

        <polygon
          points={polygonPoints}
          fill="url(#forecast-fill)"
          opacity={0.95}
        />

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
