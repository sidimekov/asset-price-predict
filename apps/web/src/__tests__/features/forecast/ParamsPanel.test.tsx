/* eslint-env browser */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect} from 'vitest';
import { store } from '@/shared/store';
import ParamsPanel from '@/features/forecast/ParamsPanel';
import { setForecastParams } from '@/entities/forecast/model/forecastSlice';

function renderWithStore() {
  return render(
    <Provider store={store}>
      <ParamsPanel />
    </Provider>,
  );
}

describe('ParamsPanel', () => {
  it('рендерит текущие параметры из стора', () => {
    // Задаём нестандартные значения, чтобы явно проверить биндинг из стора
    store.dispatch(
      setForecastParams({
        timeframe: '8h',
        horizon: 42,
        model: 'baseline',
      }),
    );

    renderWithStore();

    // селект таймфрейма
    expect(screen.getByDisplayValue('8h')).toBeInTheDocument();

    // инпут горизонта
    expect(screen.getByDisplayValue('42')).toBeInTheDocument();

    // опция модели baseline существует
    const baselineOption = screen.getByRole('option', { name: 'Baseline' });
    expect(baselineOption).toBeInTheDocument();

    // и в сторе точно лежит baseline
    expect(store.getState().forecast.params.model).toBe('baseline');
  });

  it('меняет параметры и диспатчит в стор', () => {
    renderWithStore();

    // меняем timeframe по label
    const timeframeSelect = screen.getByLabelText(
      'Timeframe',
    ) as HTMLSelectElement;
    fireEvent.change(timeframeSelect, { target: { value: '1d' } });

    // меняем horizon — берём единственный number input по роли
    const horizonInput = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(horizonInput, { target: { value: '100' } });

    // меняем model
    const modelSelect = screen.getByLabelText('Model') as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'advanced' } });

    // проверяем, что в сторе всё обновилось
    const state = store.getState().forecast.params;
    expect(state.timeframe).toBe('1d');
    expect(state.horizon).toBe(100);
    expect(state.model).toBe('advanced');
  });
});