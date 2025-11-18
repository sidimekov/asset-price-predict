import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import ForecastChart from '@/features/forecast/Chart';
import type { ForecastState } from '@/entities/forecast/model/forecastSlice';

// Мокаем стор-хуки так же, как в тестах ParamsPanel
let mockState: { forecast: ForecastState };

vi.mock('@/shared/store/hooks', () => ({
  useAppSelector: (selector: (state: typeof mockState) => any) =>
    selector(mockState),
}));

const makeForecastState = (hasData: boolean): ForecastState => ({
  params: {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    horizon: 24,
    model: undefined,
  },
  series: hasData
    ? {
        p50: [[1_000_000, 10]],
        p10: [[1_000_000, 8]],
        p90: [[1_000_000, 12]],
      }
    : {
        p50: [],
        p10: [],
        p90: [],
      },
  explain: [],
  meta: null,
});

describe('ForecastChart', () => {
  beforeEach(() => {
    mockState = { forecast: makeForecastState(false) };
  });

  it('показывает заглушку, если нет данных', () => {
    render(<ForecastChart />);

    expect(screen.getByText(/Нет данных прогноза/i)).toBeInTheDocument();
  });

  it('рисует заголовок и подпись, если данные есть', () => {
    mockState = { forecast: makeForecastState(true) };

    render(<ForecastChart />);

    expect(screen.getByText('Прогноз цены')).toBeInTheDocument();
    expect(screen.getByText(/BTCUSDT · 1h · горизонт 24/)).toBeInTheDocument();
  });
});
