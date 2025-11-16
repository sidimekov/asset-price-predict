// apps/web/src/__tests__/features/forecast/ParamsPanel.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import ParamsPanel from '@/features/forecast/ParamsPanel';
import {
  forecastReducer,
  setForecastParams,
} from '@/entities/forecast/model/forecastSlice';

// Минимальный тестовый store только с forecast-слайсом
function createTestStore() {
  const store = configureStore({
    reducer: {
      forecast: forecastReducer,
    },
  });

  // Инициализируем удобными стартовыми параметрами
  store.dispatch(
    setForecastParams({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      horizon: 42,
      model: 'baseline',
    }),
  );

  return store;
}

describe('ParamsPanel', () => {
  it('рендерит заголовок и контролы', () => {
    const store = createTestStore();

    const { container } = render(
      <Provider store={store}>
        <ParamsPanel />
      </Provider>,
    );

    // Заголовок
    expect(screen.getByText('Параметры прогноза')).toBeInTheDocument();

    // Находим элементы напрямую через DOM, без DOM-типов
    const selects = container.querySelectorAll('select');
    const timeframeSelect = selects[0] as any;
    const modelSelect = selects[1] as any;
    const horizonInput = container.querySelector('input[type="number"]') as any;

    expect(timeframeSelect).toBeTruthy();
    expect(horizonInput).toBeTruthy();
    expect(modelSelect).toBeTruthy();

    // Проверяем стартовые значения из стора
    expect(timeframeSelect.value).toBe('1h');
    expect(horizonInput.value).toBe('42');
    expect(modelSelect.value).toBe('baseline');
  });

  it('меняет параметры и диспатчит в стор', () => {
    const store = createTestStore();

    const { container } = render(
      <Provider store={store}>
        <ParamsPanel />
      </Provider>,
    );

    const selects = container.querySelectorAll('select');
    const timeframeSelect = selects[0] as any;
    const modelSelect = selects[1] as any;
    const horizonInput = container.querySelector('input[type="number"]') as any;

    // Меняем timeframe
    fireEvent.change(timeframeSelect, {
      target: { value: '8h' },
    });

    // Меняем horizon
    fireEvent.change(horizonInput, {
      target: { value: '100' },
    });

    // Меняем model
    fireEvent.change(modelSelect, {
      target: { value: 'advanced' },
    });

    const state = store.getState().forecast.params;

    expect(state.timeframe).toBe('8h');
    expect(state.horizon).toBe(100);
    expect(state.model).toBe('advanced');
  });
});
