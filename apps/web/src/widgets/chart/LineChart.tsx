'use client';

import React from 'react';

type LinePoint = [number, number];

type LineChartProps = {
  series: LinePoint[];
  className?: string;
  stroke?: string;
};

function buildPath(series: LinePoint[], width: number, height: number) {
  const xs = series.map((p) => p[0]);
  const ys = series.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const xScale = (x: number) =>
    maxX === minX ? width / 2 : ((x - minX) / (maxX - minX)) * width;
  const yScale = (y: number) =>
    maxY === minY ? height / 2 : height - ((y - minY) / (maxY - minY)) * height;

  return series
    .map((p, idx) => {
      const x = xScale(p[0]);
      const y = yScale(p[1]);
      return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

export default function LineChart({
  series,
  className,
  stroke = '#FFBFF6',
}: LineChartProps) {
  if (!series.length) {
    return (
      <div className={className}>
        <div className="h-full w-full flex items-center justify-center text-xs text-ink-muted">
          No data
        </div>
      </div>
    );
  }

  const width = 100;
  const height = 100;
  const path = buildPath(series, width, height);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={0.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
