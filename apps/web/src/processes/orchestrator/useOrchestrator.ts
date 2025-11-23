import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { store } from '@/shared/store';
import { ForecastManager } from './ForecastManager';
import { selectSelectedAsset, selectForecastParams } from './state';
import type { MarketDataProvider, MarketTimeframe } from '@/config/market';

const ORCHESTRATOR_DEBOUNCE_MS = 250;

export function useOrchestrator() {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(selectSelectedAsset);
  const params = useAppSelector(selectForecastParams);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignatureRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!selected || !params) return;

    const { symbol, provider } = selected;
    const { tf, window, horizon, model } = params;

    if (!symbol || !provider || !tf || !horizon) return;

    // нормализуем provider и window под ожидания ForecastManager
    const providerNorm = provider as MarketDataProvider;
    const windowNum = typeof window === 'string' ? Number(window) : window;

    if (!Number.isFinite(windowNum) || windowNum <= 0) {
      // некорректное окно - просто не запускаем оркестратор
      return;
    }

    const signature = `${providerNorm}:${symbol}:${tf}:${windowNum}:${horizon}:${
      model ?? 'client'
    }`;

    if (signature === lastSignatureRef.current) {
      return;
    }
    lastSignatureRef.current = signature;

    // отменяем предыдущий запуск
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const abortController = new AbortController();
    abortRef.current = abortController;

    timeoutRef.current = setTimeout(() => {
      ForecastManager.run(
        {
          symbol,
          provider: providerNorm,
          tf: tf as MarketTimeframe,
          window: windowNum,
          horizon,
          model,
        },
        {
          dispatch,
          getState: store.getState,
          signal: abortController.signal,
        },
      ).catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Orchestrator] run error', err);
        }
      });
    }, ORCHESTRATOR_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [dispatch, selected, params]);
}
