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

// mock provider for debug (uncomment method signature and comment original signature)

// function mapProviderToMarket(provider: string): MarketDataProvider | 'MOCK' | null {
//   // DEV override: всегда моковые таймсерии
//   if (process.env.NODE_ENV !== 'production') return 'MOCK';
function mapProviderToMarket(provider: string): MarketDataProvider | null {

  switch (provider) {
    case 'binance':
      return 'BINANCE';
    case 'moex':
      return 'MOEX';
    default:
      return null;
  }
}

export function useOrchestrator() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  const selected = useAppSelector(selectSelectedAsset);
  const params = useAppSelector(selectForecastParams);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignatureRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // mock params (uncomment for debug):
    //
    // const params = (process.env.NODE_ENV !== 'production'
    //   ? { tf: '1h', window: 200, horizon: 24, model: null }
    //   : undefined);

    if (!selected || !params) return;

    const { symbol, provider } = selected;
    const { tf, window, horizon, model } = params;

    if (!symbol || !provider || !tf || !horizon) return;

    const providerNorm = mapProviderToMarket(provider);
    if (!providerNorm) return;

    const windowNum = typeof window === 'string' ? Number(window) : window;

    if (!Number.isFinite(windowNum) || windowNum <= 0) {
      return;
    }

    const signature = `${providerNorm}:${symbol}:${tf}:${windowNum}:${horizon}:${
      model ?? 'client'
    }`;

    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;

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
      );
      // ForecastManager.run больше не бросает ошибки наружу
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
  }, [dispatch, store, selected, params]);
}
