'use client';

import React from 'react';

type CandlesChartProps = {
  bars: number[][];
  className?: string;
};

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
};

const UP_COLOR = '#FFBFF6';
const DOWN_COLOR = '#9B6A8D';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toCandles(bars: number[][]): Candle[] {
  return bars
    .map((bar) => {
      const open = bar?.[1];
      const high = bar?.[2];
      const low = bar?.[3];
      const close = bar?.[4];

      if (
        !isFiniteNumber(open) ||
        !isFiniteNumber(high) ||
        !isFiniteNumber(low) ||
        !isFiniteNumber(close)
      ) {
        return null;
      }

      return { open, high, low, close };
    })
    .filter((bar): bar is Candle => bar !== null);
}

export default function CandlesChart({ bars, className }: CandlesChartProps) {
  const candles = toCandles(bars);

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
  const stepX = width / (candles.length - 1);
  const candleWidth = Math.max(1.2, Math.min(stepX * 0.6, 8));
  const minBodyHeight = 1.2;

  const valueToY = (value: number) => {
    if (maxY === minY) {
      return height / 2;
    }
    const t = (value - minY) / (maxY - minY);
    return height - t * height;
  };

  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {candles.map((candle, index) => {
          const x = index * stepX;
          const openY = valueToY(candle.open);
          const closeY = valueToY(candle.close);
          const highY = valueToY(candle.high);
          const lowY = valueToY(candle.low);

          const isUp = candle.close >= candle.open;
          const color = isUp ? UP_COLOR : DOWN_COLOR;

          const bodyTop = Math.min(openY, closeY);
          const bodyBottom = Math.max(openY, closeY);
          const bodyHeight = Math.max(bodyBottom - bodyTop, minBodyHeight);
          const bodyY =
            bodyBottom - bodyTop < minBodyHeight
              ? bodyTop - minBodyHeight / 2
              : bodyTop;

          return (
            <g key={`${index}-${x}`}>
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={color}
                strokeWidth={0.8}
                strokeLinecap="round"
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                rx={0.6}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
