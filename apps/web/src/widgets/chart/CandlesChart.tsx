'use client';

import React from 'react';
import type { Bar } from '@shared/types/market';
import type { MarketTimeframe } from '@/config/market';

type CandlesChartProps = {
  bars: Bar[];
  className?: string;
  timeframe?: MarketTimeframe;
};

type Candle = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

const UP_COLOR = '#7CFFB2';
const DOWN_COLOR = '#FF6B9A';
const WICK_COLOR = '#E7D6FF';
const MIN_BODY_HEIGHT = 2;
const MIN_CANDLE_WIDTH = 3;
const MAX_CANDLE_WIDTH = 14;

const TIMEFRAME_MS: Record<MarketTimeframe, number> = {
  '1h': 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '1mo': 30 * 24 * 60 * 60 * 1000,
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toCandles(bars: Bar[]): Candle[] {
  return bars
    .map((bar) => {
      const ts = bar?.[0];
      const open = bar?.[1];
      const high = bar?.[2];
      const low = bar?.[3];
      const close = bar?.[4];

      if (
        !isFiniteNumber(ts) ||
        !isFiniteNumber(open) ||
        !isFiniteNumber(high) ||
        !isFiniteNumber(low) ||
        !isFiniteNumber(close)
      ) {
        return null;
      }

      return { ts, open, high, low, close };
    })
    .filter((bar): bar is Candle => bar !== null);
}

function aggregateCandles(bars: Bar[], bucketMs?: number): Candle[] {
  if (!bucketMs) {
    return toCandles(bars);
  }

  const sorted = [...bars].sort((a, b) => Number(a?.[0]) - Number(b?.[0]));
  const buckets = new Map<number, Candle>();

  for (const bar of sorted) {
    const ts = bar?.[0];
    const open = bar?.[1];
    const high = bar?.[2];
    const low = bar?.[3];
    const close = bar?.[4];

    if (
      !isFiniteNumber(ts) ||
      !isFiniteNumber(open) ||
      !isFiniteNumber(high) ||
      !isFiniteNumber(low) ||
      !isFiniteNumber(close)
    ) {
      continue;
    }

    const bucketStart = Math.floor(ts / bucketMs) * bucketMs;
    const existing = buckets.get(bucketStart);

    if (!existing) {
      buckets.set(bucketStart, { ts: bucketStart, open, high, low, close });
      continue;
    }

    existing.high = Math.max(existing.high, high);
    existing.low = Math.min(existing.low, low);
    existing.close = close;
  }

  return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts);
}

export default function CandlesChart({
  bars,
  className,
  timeframe,
}: CandlesChartProps) {
  const bucketMs = timeframe ? TIMEFRAME_MS[timeframe] : undefined;
  const candles = aggregateCandles(bars, bucketMs);

  if (candles.length < 2) {
    return (
      <div className={className}>
        <div className="h-full w-full flex items-center justify-center text-xs text-ink-muted">
          No data
        </div>
      </div>
    );
  }

  const lows = candles.map((c) => c.low);
  const highs = candles.map((c) => c.high);
  const minY = Math.min(...lows);
  const maxY = Math.max(...highs);

  const width = 100;
  const height = 100;
  const xs = candles.map((c) => c.ts);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const rangeX = Math.max(1, maxX - minX);
  const xScale = (x: number) =>
    maxX === minX ? width / 2 : ((x - minX) / rangeX) * width;
  const xPositions = candles.map((c) => xScale(c.ts));
  const xDeltas = xPositions
    .slice(1)
    .map((x, idx) => Math.abs(x - xPositions[idx]))
    .filter((delta) => delta > 0);
  const avgStep =
    xDeltas.length > 0
      ? xDeltas.reduce((sum, delta) => sum + delta, 0) / xDeltas.length
      : width / Math.max(1, candles.length - 1);
  const timeBasedWidth = bucketMs ? (bucketMs / rangeX) * width : avgStep;
  const candleWidth = Math.max(
    MIN_CANDLE_WIDTH,
    Math.min(timeBasedWidth * 0.8, MAX_CANDLE_WIDTH),
  );

  const valueToY = (value: number) => {
    if (maxY === minY) {
      return height / 2;
    }
    const t = (value - minY) / (maxY - minY);
    return height - t * height;
  };

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        {candles.map((candle, index) => {
          const x = xPositions[index];
          const openY = valueToY(candle.open);
          const closeY = valueToY(candle.close);
          const highY = valueToY(candle.high);
          const lowY = valueToY(candle.low);

          const isUp = candle.close >= candle.open;
          const color = isUp ? UP_COLOR : DOWN_COLOR;

          const bodyTop = Math.min(openY, closeY);
          const bodyBottom = Math.max(openY, closeY);
          const bodyHeight = Math.max(bodyBottom - bodyTop, MIN_BODY_HEIGHT);
          const bodyY =
            bodyBottom - bodyTop < MIN_BODY_HEIGHT
              ? bodyTop - MIN_BODY_HEIGHT / 2
              : bodyTop;

          return (
            <g key={`${index}-${x}`}>
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={WICK_COLOR}
                strokeWidth={1.2}
                strokeLinecap="round"
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                stroke={WICK_COLOR}
                strokeWidth={0.8}
                rx={1}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
