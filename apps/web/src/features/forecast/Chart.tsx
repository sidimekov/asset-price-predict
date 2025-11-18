'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';

import { useAppSelector } from '@/shared/store/hooks';
import {
  selectForecastSeries,
  selectForecastParams,
  type ForecastPoint,
} from '@/entities/forecast/model/forecastSlice';

// Если в этой ветке уже есть timeseriesSlice как в MarketAdapter — можно раскомментить
// и использовать реальные бары. Пока оставим график чисто по прогнозу.
// import {
//   selectTimeseriesByKey,
//   buildTimeseriesKey,
// } from '@/entities/timeseries/model/timeseriesSlice';
// import { DEFAULT_PROVIDER, type MarketTimeframe } from '@/config/market';
// import type { Bar } from '@shared/types/market';

type ChartPoint = {
  ts: number;
  close?: number;
  p10?: number;
  p50?: number;
  p90?: number;
};

function formatTs(ts: number) {
  try {
    return format(new Date(ts), 'dd.MM.yyyy HH:mm');
  } catch {
    return String(ts);
  }
}

export default function ForecastChart() {
  const params = useAppSelector(selectForecastParams);
  const forecastSeries = useAppSelector(selectForecastSeries);

  // Если подключишь timeseriesSlice — сюда же добавь исторические бары
  const data: ChartPoint[] = useMemo(() => {
    const map = new Map<number, ChartPoint>();

    // Пример для баров (оставляю закомментированным, чтобы не ломать сборку,
    // пока нет timeseriesSlice в этой ветке)
    //
    // const key = buildTimeseriesKey(
    //   DEFAULT_PROVIDER,
    //   params.symbol,
    //   params.timeframe as MarketTimeframe,
    // );
    // const bars = useAppSelector((state) => selectTimeseriesByKey(state, key) ?? []);
    // for (const bar of bars as Bar[]) {
    //   const [ts, , , , close] = bar;
    //   map.set(ts, { ts, close });
    // }

    for (const fp of forecastSeries as ForecastPoint[]) {
      const existing = map.get(fp.ts) ?? { ts: fp.ts };
      if (fp.p10 != null) existing.p10 = fp.p10;
      if (fp.p50 != null) existing.p50 = fp.p50;
      if (fp.p90 != null) existing.p90 = fp.p90;
      map.set(fp.ts, existing);
    }

    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  }, [forecastSeries /*, params*/]);

  if (!data.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
        Нет данных прогноза.
      </div>
    );
  }

  return (
    <div className="w-full h-[360px] bg-surface rounded-xl shadow-card p-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Прогноз цены</h2>
          <p className="text-sm text-muted-foreground">
            {params.symbol} · {params.timeframe} · горизонт {params.horizon}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" tickFormatter={formatTs} minTickGap={32} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} width={60} />
          <Tooltip
            labelFormatter={(value) => formatTs(value as number)}
            formatter={(value, name) => {
              const labelMap: Record<string, string> = {
                close: 'Цена',
                p10: 'P10',
                p50: 'P50',
                p90: 'P90',
              };
              return [value as number, labelMap[name] ?? name];
            }}
          />

          {/* Коридор P10–P90 */}
          <Area
            type="monotone"
            dataKey="p90"
            yAxisId="left"
            stroke="none"
            fillOpacity={0.1}
            fill="currentColor"
          />
          <Area
            type="monotone"
            dataKey="p10"
            yAxisId="left"
            stroke="none"
            fillOpacity={0.1}
            fill="currentColor"
          />

          {/* Линия прогноза P50 */}
          <Line
            type="monotone"
            dataKey="p50"
            yAxisId="left"
            dot={false}
            strokeWidth={2}
            stroke="currentColor"
          />

          {/* Если добавишь исторические бары — можно добавить Line по close */}
          {/* <Line
            type="monotone"
            dataKey="close"
            yAxisId="left"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          /> */}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
