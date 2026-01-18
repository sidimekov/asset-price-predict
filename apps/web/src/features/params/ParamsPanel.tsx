'use client';

import React from 'react';
import Skeleton from '@/shared/ui/Skeleton';
import { SUPPORTED_TIMEFRAMES } from '@/config/market';

type ParamsState = 'idle' | 'loading' | 'error' | 'success';

interface ParamsPanelProps {
  state: ParamsState;
  onPredict?: () => void;
  buttonLabel?: string;

  selectedTimeframe?: string;
  selectedWindow?: number;
  selectedHorizon?: number;
  selectedModel?: string | null;
  onTimeframeChange?: (value: string) => void;
  onWindowChange?: (value: number) => void;
  onHorizonChange?: (value: number) => void;
  onModelChange?: (value: string | null) => void;
  readOnly?: boolean;
}

export default function ParamsPanel({
  state,
  onPredict,
  buttonLabel,
  selectedTimeframe,
  selectedWindow,
  selectedHorizon,
  selectedModel,
  onTimeframeChange,
  onWindowChange,
  onHorizonChange,
  onModelChange,
  readOnly = false,
}: ParamsPanelProps) {
  const isLoading = state === 'loading';
  const windowMin = 1;
  const windowMax = 2000;

  const [internalTimeframe, setInternalTimeframe] = React.useState<string>(
    selectedTimeframe ?? '1h',
  );
  const [internalWindow, setInternalWindow] = React.useState<number>(
    selectedWindow ?? 200,
  );
  const [internalHorizon, setInternalHorizon] = React.useState<number>(
    selectedHorizon ?? 24,
  );
  const [internalModel, setInternalModel] = React.useState<string>(
    selectedModel ?? '',
  );

  const timeframeValue = selectedTimeframe ?? internalTimeframe;
  const windowValue = selectedWindow ?? internalWindow;
  const horizonValue = selectedHorizon ?? internalHorizon;
  const modelValue = selectedModel ?? internalModel;

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (readOnly) return;
    onTimeframeChange?.(value);
    if (selectedTimeframe === undefined) {
      setInternalTimeframe(value);
    }
  };

  const handleWindowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number.parseInt(e.target.value, 10);
    if (readOnly) return;
    const value = Number.isFinite(next) ? next : 0;
    onWindowChange?.(value);
    if (selectedWindow === undefined) {
      setInternalWindow(value);
    }
  };

  const handleHorizonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number.parseInt(e.target.value, 10);
    if (readOnly) return;
    const value = Number.isFinite(next) ? next : 0;
    onHorizonChange?.(value);
    if (selectedHorizon === undefined) {
      setInternalHorizon(value);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawValue = e.target.value;
    if (readOnly) return;
    const value = rawValue === '' ? null : rawValue;
    onModelChange?.(value);
    if (selectedModel === undefined) {
      setInternalModel(value ?? '');
    }
  };

  const paramsReady =
    Number.isFinite(windowValue) &&
    windowValue > 0 &&
    Number.isFinite(horizonValue) &&
    horizonValue > 0 &&
    Boolean(timeframeValue);
  const canPredict = readOnly || paramsReady;

  if (state === 'loading') {
    return (
      <div className="mt-8 bg-surface-dark rounded-3xl p-6 ">
        <p className="text-[#8480C9]">Parameters</p>
        <br />
        <div className="param-panel-item w-full h-12 pl-4 rounded overflow-hidden relative -mt-2">
          <Skeleton width="100%" height="100%" />
        </div>
        <br />
        <br />
        <div className="param-panel-item w-full h-12 pl-4 rounded overflow-hidden relative -mt-2">
          <Skeleton width="100%" height="100%" />
        </div>
        <br />
        <br />
        <div className="param-panel-item w-full h-12 pl-4 rounded overflow-hidden relative -mt-2">
          <Skeleton width="100%" height="100%" />
        </div>
        <br />
        <br />
        <div className="relative left-10 gradient-button w-60 h-12 rounded overflow-hidden -mt-2">
          <Skeleton width="100%" height="100%" />
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="mt-8 bg-surface-dark rounded-3xl p-6 ">
        <p className="text-error">Error loading parameters</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-surface-dark rounded-3xl p-6 ">
      <p className="text-[#8480C9]">Parameters</p>
      <br />

      <select
        className="appearance-none text-center param-panel-item w-full h-12 pl-4 rounded"
        value={timeframeValue}
        onChange={handleTimeframeChange}
        disabled={readOnly}
      >
        {SUPPORTED_TIMEFRAMES.map((tf) => (
          <option key={tf} value={tf} className="text-center">
            {tf}
          </option>
        ))}
      </select>

      <br />
      <br />

      <input
        type="number"
        min={windowMin}
        max={windowMax}
        step={1}
        className="text-center param-panel-item w-full h-12 pl-4 rounded"
        value={windowValue}
        onChange={handleWindowChange}
        disabled={readOnly}
        placeholder="Window (lookback)"
        title="Window = количество исторических баров (lookback)"
      />

      <br />
      <div className="text-xs text-ink-muted text-center">
        Window = количество исторических баров (lookback). Диапазон{' '}
        {windowMin}–{windowMax}.
      </div>
      <br />

      <input
        type="number"
        min={1}
        step={1}
        className="text-center param-panel-item w-full h-12 pl-4 rounded"
        value={horizonValue}
        onChange={handleHorizonChange}
        disabled={readOnly}
        placeholder="Horizon"
      />

      <br />
      <br />

      <select
        className="appearance-none text-center param-panel-item w-full h-12 pl-4 rounded"
        value={modelValue ?? ''}
        onChange={handleModelChange}
        disabled={readOnly}
      >
        <option value="" className="text-center">
          Default model
        </option>
        <option value="client">Client model</option>
        <option value="lgbm_v1">LGBM v1</option>
        <option value="catboost_v1">CatBoost v1</option>
        <option value="baseline">Baseline</option>
      </select>

      <br />
      <br />

      {!paramsReady && !readOnly && (
        <div className="text-xs text-ink-muted">
          Select timeframe, window, and horizon to run a forecast.
        </div>
      )}

      <br />

      <button
        className="relative left-10 gradient-button w-60 h-12 rounded text-ink font-medium transition-smooth scale-on-press"
        onClick={onPredict}
        aria-busy={isLoading}
        disabled={isLoading || !onPredict || !canPredict}
      >
        {buttonLabel ?? 'Predict'}
      </button>
    </div>
  );
}
