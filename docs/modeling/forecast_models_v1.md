# Forecast models v1 (contract)

This document defines the v1 client-side model contract for ML Worker.

## Contract

- Input: `input` -> `float32[1, n]`, fixed length.
- Features: must match ML Worker pipeline and order (see below).
- Outputs (v1 choice): `delta` -> `float32[H]`.
- Postprocess: `p50 = last_close + delta`.
- Optional intervals: not produced by the model at v1 (kept client-side later).
- Opset: `<= 17` for onnxruntime-web.

## Feature order (v1)

Order is fixed and must match `apps/web/src/workers/ml-worker.ts`:

1. last_close
2. mean_5
3. mean_20
4. std_20
5. momentum_3
6. momentum_8
7. ema_5
8. ema_10
9. ret_mean_5
10. ret_std_20

## Notes

- Keep `n=10` for v1 to avoid ML Worker changes.
- If we switch to `p50`/`p10`/`p90` outputs later, ML Worker will need updates.

## Training scripts

- `scripts/modeling/train_forecast_lgbm_v1.py`
- `scripts/modeling/train_forecast_catboost_v1.py`
