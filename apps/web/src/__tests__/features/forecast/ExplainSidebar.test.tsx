import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExplainSidebar from '@/features/forecast/ExplainSidebar';
import { describe, it, expect, vi } from 'vitest';
import type {
  ForecastExplainItem,
  ForecastState,
} from '@/entities/forecast/model/forecastSlice';

// Мокаем recharts
vi.mock('recharts', () => {
  const Mock: React.FC<any> = (props) => <div>{props.children}</div>;
  return {
    BarChart: Mock,
    Bar: Mock,
    XAxis: Mock,
    YAxis: Mock,
    ResponsiveContainer: Mock,
    Tooltip: Mock,
  };
});

let mockState: { forecast: ForecastState };

vi.mock('@/shared/store/hooks', () => ({
  useAppSelector: (selector: (state: typeof mockState) => any) =>
    selector(mockState),
}));

const makeBaseForecastState = (
  explain: ForecastExplainItem[],
): ForecastState => ({
  params: { symbol: 'BTCUSDT', timeframe: '1h', horizon: 24, model: undefined },
  series: { p50: [], p10: [], p90: [] },
  explain,
  meta: null,
});

describe('ExplainSidebar', () => {
  it('показывает заглушку, когда нет факторов', () => {
    mockState = {
      forecast: makeBaseForecastState([]),
    };

    render(<ExplainSidebar />);

    expect(screen.getByText(/Факторы прогноза/i)).toBeInTheDocument();
    expect(screen.getByText(/Нет данных по факторам/i)).toBeInTheDocument();
    // Одна пилюля "Все группы"
    expect(
      screen.getByRole('button', { name: /Все группы/i }),
    ).toBeInTheDocument();
  });

  it('фильтрует факторы по группе при клике на Pill', () => {
    const explain: ForecastExplainItem[] = [
      { name: 'Trend', group: 'trend', impact_abs: 0.5, sign: '+' },
      { name: 'Volatility', group: 'volatility', impact_abs: 0.3, sign: '-' },
    ];

    mockState = {
      forecast: makeBaseForecastState(explain),
    };

    render(<ExplainSidebar />);

    // Есть пилюли для групп
    const trendPill = screen.getByRole('button', { name: 'trend' });
    const allPill = screen.getByRole('button', { name: /Все группы/i });

    expect(trendPill).toBeInTheDocument();
    expect(allPill).toBeInTheDocument();

    // Сначала должны быть видны обе строки в таблице
    expect(screen.getByText('Trend')).toBeInTheDocument();
    expect(screen.getByText('Volatility')).toBeInTheDocument();

    // Кликаем по группе "trend"
    fireEvent.click(trendPill);

    // Теперь в таблице должен быть только фактор с группой trend
    expect(screen.getByText('Trend')).toBeInTheDocument();
    expect(screen.queryByText('Volatility')).not.toBeInTheDocument();
  });
});
