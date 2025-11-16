'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
  selectForecastParams,
  setForecastParams,
} from '@/entities/forecast/model/forecastSlice';

const SUPPORTED_TIMEFRAMES = ['1h', '8h', '1d', '7d', '1mo'];

export default function ParamsPanel() {
  const dispatch = useAppDispatch();
  const params = useAppSelector(selectForecastParams);

  const handleChange = useCallback(
    (patch: Partial<typeof params>) => {
      dispatch(
        setForecastParams({
          ...params,
          ...patch,
        }),
      );
      // здесь позже будет Orchestrator.run() после смены параметров
    },
    [dispatch, params],
  );

  return (
    <div className="w-full bg-surface rounded-xl shadow-card p-4 space-y-4">
      <h2 className="text-lg font-semibold text-ink">Параметры прогноза</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Timeframe */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Timeframe</span>
          <select
            className="input-base"
            value={params.timeframe}
            onChange={(e) => handleChange({ timeframe: e.target.value })}
          >
            {SUPPORTED_TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </label>

        {/* Horizon */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Horizon</span>
          <input
            type="number"
            min={1}
            max={500}
            className="input-base"
            value={params.horizon}
            onChange={(e) =>
              handleChange({
                horizon: Number(e.target.value) || 1,
              })
            }
          />
          <span className="text-[10px] text-muted-foreground">
            Количество точек прогноза (максимум 500).
          </span>
        </label>

        {/* Model */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Model</span>
          <select
            className="input-base"
            value={params.model ?? ''}
            onChange={(e) =>
              handleChange({
                model: e.target.value || undefined,
              })
            }
          >
            <option value="">Auto</option>
            <option value="baseline">Baseline</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
      </div>
    </div>
  );
}
