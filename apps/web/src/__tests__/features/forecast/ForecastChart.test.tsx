import React from 'react';
import { render, screen } from '@testing-library/react';
import ForecastChart from '@/features/forecast/Chart';
import type { ForecastState } from '@/entities/forecast/model/forecastSlice';
import { describe, it, expect, vi } from 'vitest';

// Мокаем recharts, чтобы не было проблем с layout/ResizeObserver
vi.mock('recharts', () => {
  const Mock: React.FC<any> = (props) => <div>{props.children}</div>;
  return {
    ResponsiveContainer: Mock,
    ComposedChart: Mock,
    Line: Mock,
    Area: Mock,
    XAxis: Mock,
    YAxis: Mock,
    CartesianGrid: Mock,
    Tooltip: Mock,
  };
});

let mockState: { forecast: ForecastState };

vi.mock('@/shared/store/hooks', () => ({
  useAppSelector: (selector: (state: typeof mockState) => any) =>
    selector(mockState),
}));

const makeBaseForecastState = (): ForecastState => ({
  params: {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    horizon: 24,
    model: undefined,
  },
  series: {
    p50: [],
    p10: [],
    p90: [],
  },
  explain: [],
  meta: null,
});

describe('ForecastChart', () => {
  it('рендерит сообщение, когда нет данных прогноза', () => {
    mockState = {
      forecast: makeBaseForecastState(),
    };

    render(<ForecastChart />);

    expect(screen.getByText(/Нет данных прогноза/i)).toBeInTheDocument();
  });

  it('рендерит заголовок и подпись, когда есть точки прогноза', () => {
    const state = makeBaseForecastState();
    state.series.p50 = [
      [Date.now() - 1_000, 100],
      [Date.now(), 105],
    ];

    mockState = { forecast: state };

    render(<ForecastChart />);

    expect(screen.getByText(/Прогноз цены/i)).toBeInTheDocument();
    expect(screen.getByText(/BTCUSDT · 1h · горизонт 24/i)).toBeInTheDocument();
    expect(screen.queryByText(/Нет данных прогноза/i)).not.toBeInTheDocument();
  });
});
