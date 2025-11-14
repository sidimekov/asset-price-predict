import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/shared/store';
import { ForecastManager } from './ForecastManager';
import { ORCHESTRATOR_DEBOUNCE_MS } from './useOrchestratorConfig';
import { selectSelectedAsset, selectForecastParams } from './state';

export function useOrchestrator() {
  const selected = useSelector((state: RootState) => selectSelectedAsset(state));
  const params = useSelector((state: RootState) => selectForecastParams(state));

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selected || !params) return;

    const { symbol, provider } = selected;
    const { tf, window, horizon, model } = params;

    if (!symbol || !provider || !tf || !horizon) return;

    const signature = `${provider}:${symbol}:${tf}:${window}:${horizon}:${model || 'client'}`;

    if (signature === lastSignatureRef.current) {
      return;
    }
    lastSignatureRef.current = signature;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      ForecastManager.run({
        symbol,
        provider,
        tf: tf as any, // TODO: сделать Timeframe, когда params будет типизирован через shared
        window,
        horizon,
        model,
      });
    }, ORCHESTRATOR_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selected, params]);
}