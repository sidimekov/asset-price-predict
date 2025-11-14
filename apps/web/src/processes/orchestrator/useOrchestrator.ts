import { useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { useAppDispatch } from "@/shared/store/hooks"
import type { RootState } from "@/shared/store"
import { store } from "@/shared/store"
import { ForecastManager } from "./ForecastManager"
import { selectSelectedAsset, selectForecastParams } from "./state"

const ORCHESTRATOR_DEBOUNCE_MS = 250

export function useOrchestrator() {
  const dispatch = useAppDispatch()
  const selected = useSelector((state: RootState) => selectSelectedAsset(state))
  const params = useSelector((state: RootState) => selectForecastParams(state))

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selected || !params) return

    const { symbol, provider } = selected
    const { tf, window, horizon, model } = params

    if (!symbol || !provider || !tf || !horizon) return

    const signature = `${provider}:${symbol}:${tf}:${window}:${horizon}:${model || "client"}`

    if (signature === lastSignatureRef.current) {
      return
    }
    lastSignatureRef.current = signature

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const abortController = new AbortController()

    timeoutRef.current = setTimeout(() => {
      ForecastManager.run(
        { symbol, provider, tf: tf as any, window, horizon, model },
        {
          dispatch,
          getState: store.getState,
          signal: abortController.signal,
        },
      ).catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[Orchestrator] run error", err)
        }
      })
    }, ORCHESTRATOR_DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      abortController.abort()
    }
  }, [dispatch, selected, params])
}