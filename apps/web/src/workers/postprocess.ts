/**
 * Восстановление цен из дельт
 * delta = [d1, d2, d3, ...]
 * price[0] = lastClose + d1
 * price[1] = price[0] + d2
 */
export function postprocessDelta(
  delta: Float32Array,
  lastClose: number,
  horizon: number,
): number[] {
  if (!delta || delta.length === 0) {
    return [];
  }

  const out: number[] = new Array(horizon);
  let acc = lastClose;

  for (let i = 0; i < horizon; i++) {
    const d = delta[i] ?? 0;
    acc += d;
    out[i] = acc;
  }

  return out;
}
