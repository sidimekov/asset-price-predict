import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import ForecastPage from '@/app/forecast/[id]/page';

// Мокаем тяжёлые дочерние компоненты, чтобы не тащить Recharts и т.п.
vi.mock('@/features/forecast/Chart', () => ({
  default: () => <div data-testid="forecast-chart-mock" />,
}));

vi.mock('@/features/forecast/ExplainSidebar', () => ({
  default: () => <aside data-testid="forecast-explain-mock" />,
}));

vi.mock('@/features/forecast/ParamsPanel', () => ({
  default: () => (
    <div data-testid="forecast-params-mock">Параметры прогноза</div>
  ),
}));

describe('ForecastPage', () => {
  it('рендерит заголовок и основные блоки', async () => {
    const ui = await ForecastPage({
      params: Promise.resolve({ id: '123' }),
    });

    render(ui);

    expect(screen.getByText('Прогноз #123')).toBeInTheDocument();
    expect(screen.getByText('Параметры прогноза')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-chart-mock')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-explain-mock')).toBeInTheDocument();
  });
});
