import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ParamsPanel from '@/features/forecast/ParamsPanel';
import type { ForecastState } from '@/entities/forecast/model/forecastSlice';

let mockState: { forecast: ForecastState };
const mockDispatch = vi.fn();

// мокаем хуки стора
vi.mock('@/shared/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: typeof mockState) => any) =>
    selector(mockState),
}));

const makeBaseForecastState = (): ForecastState => ({
  params: {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    horizon: 24,
    model: undefined, // как в реальном initialState
  },
  series: { p50: [], p10: [], p90: [] },
  explain: [],
  meta: null,
});

describe('ParamsPanel', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockState = { forecast: makeBaseForecastState() };
  });

  it('рендерит текущие параметры', () => {
    render(<ParamsPanel />);

    // селект таймфрейма
    expect(screen.getByDisplayValue('1h')).toBeInTheDocument();

    // инпут горизонта (number)
    expect((screen.getByDisplayValue('24') as HTMLInputElement).type).toBe(
      'number',
    );

    // селект модели — по умолчанию Auto (value === '')
    const modelSelect = screen.getByLabelText(/Model/i) as HTMLSelectElement;
    expect(modelSelect.value).toBe('');
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('диспатчит setForecastParams при изменении таймфрейма', () => {
    render(<ParamsPanel />);

    const tfSelect = screen.getByLabelText(/Timeframe/i) as HTMLSelectElement;
    fireEvent.change(tfSelect, { target: { value: '8h' } });

    expect(mockDispatch).toHaveBeenCalled();
    const action = mockDispatch.mock.calls.at(-1)?.[0];

    expect(action.type).toBe('forecast/setForecastParams');
    expect(action.payload.timeframe).toBe('8h');
    expect(action.payload.symbol).toBe('BTCUSDT');
  });

  it('диспатчит setForecastParams при изменении горизонта', () => {
    render(<ParamsPanel />);

    const horizonInput = screen.getByLabelText(/Horizon/i) as HTMLInputElement;
    fireEvent.change(horizonInput, { target: { value: '100' } });

    const action = mockDispatch.mock.calls.at(-1)?.[0];

    expect(action.type).toBe('forecast/setForecastParams');
    expect(action.payload.horizon).toBe(100);
  });

  it('диспатчит setForecastParams при изменении модели', () => {
    render(<ParamsPanel />);

    const modelSelect = screen.getByLabelText(/Model/i) as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'advanced' } });

    const action = mockDispatch.mock.calls.at(-1)?.[0];

    expect(action.type).toBe('forecast/setForecastParams');
    expect(action.payload.model).toBe('advanced');
  });
});
