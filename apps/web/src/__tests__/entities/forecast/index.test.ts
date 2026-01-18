import { describe, it, expect } from 'vitest';

// импортируем
import * as Forecast from '@/entities/forecast';

// и отдельно: что должно быть в barrel
import * as Slice from '@/entities/forecast/model/forecastSlice';
import * as Selectors from '@/entities/forecast/model/selectors';

describe('entities/forecast index barrel', () => {
  it('re-exports slice actions and reducer', () => {
    expect(Forecast.forecastRequested).toBe(Slice.forecastRequested);
    expect(Forecast.forecastReceived).toBe(Slice.forecastReceived);
    expect(Forecast.forecastFailed).toBe(Slice.forecastFailed);
    expect(Forecast.setForecastParams).toBe(Slice.setForecastParams);
    expect(Forecast.clearForecast).toBe(Slice.clearForecast);
    expect(Forecast.clearAllForecasts).toBe(Slice.clearAllForecasts);
    expect(Forecast.forecastReducer).toBe(Slice.forecastReducer);
  });

  it('re-exports selectors', () => {
    expect(Forecast.selectForecastState).toBe(Selectors.selectForecastState);
    expect(Forecast.selectForecastByKey).toBe(Selectors.selectForecastByKey);
    expect(Forecast.selectForecastLoading).toBe(
      Selectors.selectForecastLoading,
    );
    expect(Forecast.selectForecastError).toBe(Selectors.selectForecastError);
    expect(Forecast.selectForecastSeries).toBe(Selectors.selectForecastSeries);
    expect(Forecast.selectForecastExplain).toBe(
      Selectors.selectForecastExplain,
    );
    expect(Forecast.selectForecastMeta).toBe(Selectors.selectForecastMeta);
  });
});
