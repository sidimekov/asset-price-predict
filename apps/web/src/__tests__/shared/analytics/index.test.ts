import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { track } from '@/shared/analytics/index';
import type { AnalyticsEventName } from '@/shared/analytics/events';

type WindowWithYm = Window & { ym?: (...args: any[]) => void };

describe('track', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let ymMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (global as any).window = {} as WindowWithYm;
    ymMock = vi.fn();
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_YM_ID', '123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('does nothing if window is undefined', () => {
    delete (global as any).window;
    expect(() =>
      track('predict_success' as AnalyticsEventName, {}),
    ).not.toThrow();
  });

  it('does nothing if window.ym is not a function', () => {
    (window as any).ym = 123; // не функция
    track('predict_success' as AnalyticsEventName, { foo: 'bar' });
    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });

  it('calls window.ym with payload', () => {
    (window as WindowWithYm).ym = ymMock;
    track('predict_success' as AnalyticsEventName, { a: 1 });
    expect(ymMock).toHaveBeenCalledWith('123', 'reachGoal', 'predict_success', {
      a: 1,
    });
  });

  it('catches errors thrown by ym', () => {
    (window as WindowWithYm).ym = () => {
      throw new Error('fail');
    };
    expect(() => track('predict_success' as AnalyticsEventName)).not.toThrow();
  });

  it('logs to console.debug in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    (window as WindowWithYm).ym = ymMock;
    track('predict_success' as AnalyticsEventName, { a: 1 });
    expect(consoleDebugSpy).toHaveBeenCalledWith(
      '[analytics]',
      'predict_success',
      { a: 1 },
    );
  });

  it('does not log to console.debug in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    (window as WindowWithYm).ym = ymMock;
    track('predict_success' as AnalyticsEventName, { a: 1 });
    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });
});
