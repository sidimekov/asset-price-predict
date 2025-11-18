'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { useAppSelector } from '@/shared/store/hooks';
import {
  selectForecastExplain,
  type ForecastExplainItem,
} from '@/entities/forecast/model/forecastSlice';
import Pill from '@/shared/ui/Pill';

type ChartItem = {
  name: string;
  impact: number;
  sign: '+' | '-';
  group: string;
};

const ALL_GROUP = 'Все группы';

export default function ExplainSidebar() {
  const factors = useAppSelector(selectForecastExplain);
  const [selectedGroup, setSelectedGroup] = useState<string>(ALL_GROUP);

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const f of factors) {
      if (f.group) set.add(f.group);
    }
    return [ALL_GROUP, ...Array.from(set).sort()];
  }, [factors]);

  const topFactors = useMemo(() => {
    let items = factors as ForecastExplainItem[];

    if (selectedGroup !== ALL_GROUP) {
      items = items.filter((f) => f.group === selectedGroup);
    }

    return [...items]
      .sort((a, b) => Math.abs(b.impact_abs) - Math.abs(a.impact_abs))
      .slice(0, 5);
  }, [factors, selectedGroup]);

  const chartData: ChartItem[] = useMemo(
    () =>
      topFactors.map((f) => ({
        name: f.name,
        impact: f.impact_abs,
        sign: f.sign,
        group: f.group,
      })),
    [topFactors],
  );

  return (
    <aside className="w-full md:w-80 space-y-4">
      <div className="bg-surface rounded-xl shadow-card p-4 space-y-3">
        <h2 className="text-lg font-semibold text-ink">Факторы прогноза</h2>
        <p className="text-xs text-muted-foreground">
          Топ-5 факторов по абсолютному влиянию (impact_abs).
        </p>

        {/* Фильтры по группам */}
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <Pill
              key={group}
              label={group}
              selected={group === selectedGroup}
              onClick={() => setSelectedGroup(group)}
            />
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-card p-4 space-y-3">
        <div className="h-48">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 40, right: 16, top: 8, bottom: 8 }}
              >
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip
                  formatter={(value, _name, entry) => {
                    const v = value as number;
                    const sign = (entry.payload as ChartItem).sign;
                    return [`${v.toFixed(4)} (${sign})`, 'impact_abs'];
                  }}
                />
                <Bar
                  dataKey="impact"
                  // цветом тут управляет тема; специально не задаю конкретный цвет
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Нет данных по факторам.
            </div>
          )}
        </div>

        {/* Табличка под графиком */}
        {topFactors.length > 0 && (
          <table className="w-full text-xs mt-2">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left font-medium pb-1">Фактор</th>
                <th className="text-left font-medium pb-1">Группа</th>
                <th className="text-right font-medium pb-1">Impact</th>
              </tr>
            </thead>
            <tbody>
              {topFactors.map((f) => (
                <tr key={f.name}>
                  <td className="py-0.5 pr-2">{f.name}</td>
                  <td className="py-0.5 pr-2 text-muted-foreground">
                    {f.group}
                  </td>
                  <td className="py-0.5 text-right">
                    {f.sign}
                    {Math.abs(f.impact_abs).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </aside>
  );
}
