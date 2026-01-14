'use client';
/* global AbortController */

import { useEffect, useRef } from 'react';
import { useStore } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import type { RootState } from '@/shared/store';

import { ForecastManager } from './ForecastManager';

import { selectSelectedAsset } from '@/features/asset-catalog/model/catalogSlice';
import { selectForecastParams } from '@/entities/forecast/model/selectors';

import type { MarketDataProvider, MarketTimeframe } from '@/config/market';

const ORCHESTRATOR_DEBOUNCE_MS = 250;

function mapProviderToMarket(
  provider: string,
): MarketDataProvider | 'MOCK' | null {
  // DEV override (временно): всегда моковые таймсерии
  if (process.env.NODE_ENV !== 'production') return 'MOCK';

  switch (provider) {
    case 'binance':
      return 'BINANCE';
    case 'moex':
      return 'MOEX';
    case 'mock':
      return 'MOCK';
    default:
      return null;
  }
}

export function useOrchestrator() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  const selected = useAppSelector(selectSelectedAsset);
  const paramsFromStore = useAppSelector(selectForecastParams);

  // DEV-only дефолты (чтобы не блокировать разработку страниц)
  const params =
    paramsFromStore ??
    (process.env.NODE_ENV !== 'production'
      ? { tf: '1h', window: 200, horizon: 24, model: null }
      : undefined);

  // predict trigger: слушаем requestId
  const predictRequestId = useAppSelector(
    (s: RootState) => (s as any).forecast?.predict?.requestId ?? 0,
  );

  const predictRequest = useAppSelector(
    (s: RootState) => (s as any).forecast?.predict?.request ?? null,
  ) as {
    symbol: string;
    provider?: string;
    tf: string;
    window: number;
    horizon: number;
    model?: string | null;
  } | null;

  // --- refs for timeseries auto ---
  const tsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tsLastSignatureRef = useRef<string | null>(null);
  const tsAbortRef = useRef<AbortController | null>(null);

  // --- refs for forecast manual ---
  const fcTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fcLastRequestIdRef = useRef<number>(0);
  const fcAbortRef = useRef<AbortController | null>(null);

  /**
   * AUTO timeseries:
   * selected + params(tf/window) -> ensureTimeseriesOnly()
   */
  useEffect(() => {
    if (!selected || !params) return;

    const { symbol, provider } = selected;
    const { tf, window } = params;

    if (!symbol || !provider || !tf) return;

    const providerNorm = mapProviderToMarket(provider);
    if (!providerNorm) return;

    const windowNum = typeof window === 'string' ? Number(window) : window;
    if (!Number.isFinite(windowNum) || windowNum <= 0) return;

    const signature = `${providerNorm}:${symbol}:${tf}:${windowNum}`;

    if (signature === tsLastSignatureRef.current) return;
    tsLastSignatureRef.current = signature;

    if (tsTimeoutRef.current) {
      clearTimeout(tsTimeoutRef.current);
      tsTimeoutRef.current = null;
    }
    if (tsAbortRef.current) {
      tsAbortRef.current.abort();
      tsAbortRef.current = null;
    }

    const abortController = new AbortController();
    tsAbortRef.current = abortController;

    tsTimeoutRef.current = setTimeout(() => {
      ForecastManager.ensureTimeseriesOnly(
        {
          symbol,
          provider: providerNorm,
          tf: tf as MarketTimeframe,
          window: windowNum,
        },
        {
          dispatch,
          getState: store.getState,
          signal: abortController.signal,
        },
      );
    }, ORCHESTRATOR_DEBOUNCE_MS);

    return () => {
      if (tsTimeoutRef.current) {
        clearTimeout(tsTimeoutRef.current);
        tsTimeoutRef.current = null;
      }
      if (tsAbortRef.current) {
        tsAbortRef.current.abort();
        tsAbortRef.current = null;
      }
    };
  }, [dispatch, store, selected, params]);

  /**
   * B) MANUAL forecast:
   * реагируем только на predictRequested (requestId меняется)
   */
  useEffect(() => {
    if (!predictRequestId) return;
    if (predictRequestId === fcLastRequestIdRef.current) return;
    fcLastRequestIdRef.current = predictRequestId;

    // берём запрос, если он есть; иначе fallback на selected+params
    const req = predictRequest;

    const symbol = req?.symbol ?? selected?.symbol;
    const uiProvider = req?.provider ?? selected?.provider;
    const tf = req?.tf ?? params?.tf;
    const window = req?.window ?? params?.window;
    const horizon = req?.horizon ?? params?.horizon;
    const model = req?.model ?? params?.model ?? null;

    if (!symbol || !uiProvider || !tf || !horizon || !window) return;

    const providerNorm = mapProviderToMarket(String(uiProvider));
    if (!providerNorm) return;

    const windowNum = typeof window === 'string' ? Number(window) : window;
    if (!Number.isFinite(windowNum) || windowNum <= 0) return;

    if (fcTimeoutRef.current) {
      clearTimeout(fcTimeoutRef.current);
      fcTimeoutRef.current = null;
    }
    if (fcAbortRef.current) {
      fcAbortRef.current.abort();
      fcAbortRef.current = null;
    }

    const abortController = new AbortController();
    fcAbortRef.current = abortController;

    fcTimeoutRef.current = setTimeout(() => {
      ForecastManager.runForecast(
        {
          symbol: symbol as any,
          provider: providerNorm,
          tf: tf as MarketTimeframe,
          window: windowNum,
          horizon: Number(horizon),
          model,
        },
        {
          dispatch,
          getState: store.getState,
          signal: abortController.signal,
        },
      );
    }, ORCHESTRATOR_DEBOUNCE_MS);

    return () => {
      if (fcTimeoutRef.current) {
        clearTimeout(fcTimeoutRef.current);
        fcTimeoutRef.current = null;
      }
      if (fcAbortRef.current) {
        fcAbortRef.current.abort();
        fcAbortRef.current = null;
      }
    };
  }, [dispatch, store, selected, params, predictRequestId, predictRequest]);
}
