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

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

const dayMonthTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
});

const formatDateParts = (
  formatter: Intl.DateTimeFormat,
  date: Date,
): Record<string, string> =>
  formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

const formatTimestampTime = (date: Date) => timeFormatter.format(date);

const formatTimestampDayMonthTime = (date: Date) => {
  const parts = formatDateParts(dayMonthTimeFormatter, date);
  return `${parts.day}.${parts.month} ${parts.hour}:${parts.minute}`;
};

const formatTimestampDayMonth = (date: Date) => {
  const parts = formatDateParts(dayMonthFormatter, date);
  return `${parts.day} ${parts.month}`;
};

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const buildTimestampFormatter = (rangeMs: number) => {
  const isMonthlyRange = rangeMs >= MONTH_MS;
  const isDailyRange = rangeMs >= DAY_MS;

  return (ts: number, prevTs?: number) => {
    if (!Number.isFinite(ts)) return '—';
    const date = new Date(ts);

    if (isMonthlyRange) {
      return formatTimestampDayMonth(date);
    }

    if (isDailyRange) {
      return formatTimestampDayMonthTime(date);
    }

    if (prevTs !== undefined) {
      const prevDate = new Date(prevTs);
      if (!isSameDay(date, prevDate)) {
        return formatTimestampDayMonth(date);
      }
    }

    return formatTimestampTime(date);
  };
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

const getTimestampRange = (timestamps?: number[]) => {
  if (!timestamps || timestamps.length === 0) return 0;
  const clean = timestamps.filter((ts) => Number.isFinite(ts));
  if (clean.length < 2) return 0;
  return Math.max(...clean) - Math.min(...clean);
};

const buildTicksFromTimestamps = (
  timestamps: number[],
  tickCount: number,
  rangeMs: number,
): AxisTick[] => {
  const clean = timestamps.filter((ts) => Number.isFinite(ts));
  if (clean.length === 0) return [];
  const formatter = buildTimestampFormatter(rangeMs);

  if (clean.length === 1) {
    return [{ label: formatter(clean[0]), percent: 0 }];
  }

  const count = Math.max(2, tickCount);
  const lastIndex = clean.length - 1;
  const indices = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    indices.add(Math.round((lastIndex * i) / (count - 1)));
  }

  const sortedIndices = [...indices].sort((a, b) => a - b);

  return sortedIndices.map((idx, position) => ({
    label: formatter(
      clean[idx],
      position > 0 ? clean[sortedIndices[position - 1]] : undefined,
    ),
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
        ? buildTicksFromTimestamps(
            timestamps,
            tickCount,
            getTimestampRange(timestamps),
          )
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
