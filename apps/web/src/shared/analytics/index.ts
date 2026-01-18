import type { AnalyticsEventName } from './events';

type Payload = Record<string, any>;

export function track(event: AnalyticsEventName, payload?: Payload) {
  const YM_ID = process.env.NEXT_PUBLIC_YM_ID; // <- moved here

  if (!YM_ID) return;

  try {
    if (typeof window === 'undefined') return;
    if (typeof window.ym !== 'function') return;

    window.ym(YM_ID, 'reachGoal', event, payload);

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', event, payload);
    }
  } catch {
    // no-op
  }
}
