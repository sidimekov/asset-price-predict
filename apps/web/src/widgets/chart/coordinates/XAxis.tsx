'use client';
import React from 'react';

interface XAxisProps {
  className?: string;
  labels?: string[];
  timestamps?: number[];
  tickCount?: number;
}

const defaultTimeLabels = [
  '6:00AM',
  '12:00AM',
  '6:00PM',
  '12:00PM',
  '6:00AM',
  '12:00AM',
  '6:00PM',
  '12:00PM',
  '6:00AM',
  '12:00AM',
];

const formatTimestamp = (ts: number) => {
  if (!Number.isFinite(ts)) return '—';
  return new Date(ts).toISOString().slice(11, 16);
};

type AxisTick = {
  label: string;
  percent: number;
};

const buildTicksFromLabels = (labels: string[]): AxisTick[] => {
  if (labels.length === 0) return [];
  if (labels.length === 1) return [{ label: labels[0], percent: 0 }];

  const denom = labels.length - 1;
  return labels.map((label, index) => ({
    label,
    percent: (index / denom) * 100,
  }));
};

const buildTicksFromTimestamps = (
  timestamps: number[],
  tickCount: number,
): AxisTick[] => {
  const clean = timestamps.filter((ts) => Number.isFinite(ts));
  if (clean.length === 0) return [];

  if (clean.length === 1) {
    return [{ label: formatTimestamp(clean[0]), percent: 0 }];
  }

  const count = Math.max(2, tickCount);
  const lastIndex = clean.length - 1;
  const indices = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    indices.add(Math.round((lastIndex * i) / (count - 1)));
  }

  return [...indices]
    .sort((a, b) => a - b)
    .map((idx) => ({
      label: formatTimestamp(clean[idx]),
      percent: (idx / lastIndex) * 100,
    }));
};

export default function XAxis({
  className = '',
  labels,
  timestamps,
  tickCount = 6,
}: XAxisProps) {
  const ticks =
    labels !== undefined
      ? buildTicksFromLabels(labels)
      : timestamps
        ? buildTicksFromTimestamps(timestamps, tickCount)
        : buildTicksFromLabels(defaultTimeLabels);

  return (
    <div className={`relative h-10 w-full ${className}`}>
      {ticks.map((tick, index) => {
        const percent = tick.percent;
        const alignClass =
          index === 0
            ? 'translate-x-0 text-left'
            : index === ticks.length - 1
              ? '-translate-x-full text-right'
              : '-translate-x-1/2 text-center';

        return (
          <span
            key={index}
            className={`absolute text-xs text-ink-tertiary ${alignClass}`}
            style={{ left: `${percent}%` }}
          >
            {tick.label}
          </span>
        );
      })}
    </div>
  );
}
