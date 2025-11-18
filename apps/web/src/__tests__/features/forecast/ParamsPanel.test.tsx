import React from 'react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { render, screen, fireEvent } from '@testing-library/react';

import ParamsPanel from '@/features/forecast/ParamsPanel';
import { store } from '@/shared/store';
import { setForecastParams } from '@/entities/forecast/model/forecastSlice';

const renderWithStore = () =>
  render(
    <Provider store={store}>
      <ParamsPanel />
    </Provider>,
  );

describe('ParamsPanel', () => {
  it('рендерит текущие параметры из стора', () => {
    // задаём в сторе параметры, которые хотим увидеть
    store.dispatch(
      setForecastParams({
        timeframe: '8h',
        horizon: 42,
        model: 'baseline', // модель можно не проверять явно
      }),
    );

    renderWithStore();

    // ищем по ролям и accessible name
    const timeframeSelect = screen.getByRole('combobox', {
      name: 'Timeframe',
    });
    const horizonInput = screen.getByRole('spinbutton', {
      // label на самом деле "Horizon Количество точек прогноза (максимум 500)."
      name: /Horizon/,
    });

    expect(timeframeSelect).toHaveValue('8h');
    expect(horizonInput).toHaveValue(42);
  });

  it('меняет параметры и записывает их в стор', () => {
    // стартуем из дефолтного состояния
    store.dispatch(
      setForecastParams({
        timeframe: '1h',
        horizon: 24,
        model: '',
      }),
    );

    renderWithStore();

    const timeframeSelect = screen.getByRole('combobox', {
      name: 'Timeframe',
    });
    const horizonInput = screen.getByRole('spinbutton', {
      name: /Horizon/, // а не просто 'Horizon'
    });
    const modelSelect = screen.getByRole('combobox', {
      name: 'Model',
    });

    // меняем значения
    fireEvent.change(timeframeSelect, { target: { value: '8h' } });
    fireEvent.change(horizonInput, { target: { value: '100' } });
    fireEvent.change(modelSelect, { target: { value: 'advanced' } });

    const { params } = store.getState().forecast;

    expect(params.timeframe).toBe('8h');
    expect(params.horizon).toBe(100);
    expect(params.model).toBe('advanced');
  });
});
