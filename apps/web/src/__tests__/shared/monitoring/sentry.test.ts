import { beforeEach, describe, expect, it, vi } from 'vitest';

type MonitoringModule = typeof import('@/shared/monitoring/sentry');

const validDsn = 'https://public@example.ingest.sentry.io/123';
const fallbackNow = 1111;
const fallbackRandom = 0.2345;

describe('monitoring sentry client', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  const loadModule = async (): Promise<MonitoringModule> =>
    import('../../../shared/monitoring/sentry');

  it('skips setup when env flags are missing', async () => {
    process.env.NODE_ENV = 'production';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const module = await loadModule();

    module.initMonitoring();
    module.captureMessage('noop');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs parse errors for invalid dsn', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'not-a-url';
    process.env.NEXT_PUBLIC_SENTRY_ENABLED = 'true';
    const fetchMock = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);
    const module = await loadModule();

    module.initMonitoring();
    module.captureMessage('should not send');

    expect(consoleSpy).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('enables monitoring and sends info events with uuid ids', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SENTRY_DSN = validDsn;
    process.env.NEXT_PUBLIC_SENTRY_ENABLED = 'true';
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = 'staging';
    process.env.NEXT_PUBLIC_SENTRY_RELEASE = '1.0.0';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-abc' });
    const module = await loadModule();

    module.initMonitoring();
    module.initMonitoring();
    module.captureMessage('info payload', { foo: 'bar' });
    module.captureWorkerFailure('worker boom', { workerId: 'w1' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, firstRequest] = fetchMock.mock.calls[0];
    const firstPayload = JSON.parse(
      (firstRequest?.body as string).split('\n')[2],
    );

    expect(firstPayload.event_id).toBe('uuid-abc');
    expect(firstPayload.level).toBe('info');
    expect(firstPayload.environment).toBe('staging');
    expect(firstPayload.release).toBe('1.0.0');
    expect(firstPayload.extra).toEqual({ foo: 'bar' });
    expect(firstRequest?.headers).toMatchObject({
      'X-Sentry-Auth': expect.stringContaining('sentry_key=public'),
    });
  });

  it('falls back to default environment when env values are missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    let accessCount = 0;
    const envSpy = vi.spyOn(process, 'env', 'get').mockImplementation(() => {
      accessCount += 1;
      const base = {
        ...originalEnv,
        NEXT_PUBLIC_SENTRY_DSN: validDsn,
        NEXT_PUBLIC_SENTRY_ENABLED: 'true',
        NEXT_PUBLIC_SENTRY_RELEASE: '3.0.0',
        NEXT_PUBLIC_SENTRY_ENVIRONMENT: '',
      };

      if (accessCount === 5) {
        return { ...base, NODE_ENV: '' } as NodeJS.ProcessEnv;
      }

      return { ...base, NODE_ENV: 'production' } as NodeJS.ProcessEnv;
    });

    const module = await loadModule();
    module.initMonitoring();
    module.captureMessage('env fallback');

    const [, request] = fetchMock.mock.calls.at(-1) ?? [];
    const payload = JSON.parse((request?.body as string).split('\n')[2]);

    expect(payload.environment).toBe('production');
    envSpy.mockRestore();
  });

  it('captures errors and window events with fallback ids', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SENTRY_DSN = validDsn;
    process.env.NEXT_PUBLIC_SENTRY_ENABLED = 'true';
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = 'prod';
    process.env.NEXT_PUBLIC_SENTRY_RELEASE = '2.0.0';
    const fetchMock = vi.fn().mockRejectedValue(new Error('network'));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', {});
    vi.spyOn(Date, 'now').mockReturnValue(fallbackNow);
    vi.spyOn(Math, 'random').mockReturnValue(fallbackRandom);
    const errorHandlers: Array<(event: ErrorEvent) => void> = [];
    const rejectionHandlers: Array<(event: PromiseRejectionEvent) => void> = [];
    vi.spyOn(window, 'addEventListener').mockImplementation(
      (type, listener) => {
        if (type === 'error')
          errorHandlers.push(listener as (event: ErrorEvent) => void);
        if (type === 'unhandledrejection')
          rejectionHandlers.push(
            listener as (event: PromiseRejectionEvent) => void,
          );
      },
    );
    window.history.pushState({}, '', '/report');
    const module = await loadModule();

    module.initMonitoring();
    const fallbackId = `${fallbackNow}-${fallbackRandom.toString(16).slice(2)}`;
    const error = new Error('broken flow');
    error.stack = 'Error: broken flow\n  at first\n  at second';

    module.captureException(error, { step: 'manual' });
    module.captureDataFailure('data missing', { dataset: 'alpha' });

    errorHandlers.forEach((handler) =>
      handler(new ErrorEvent('error', { error: new Error('event crash') })),
    );
    const resolved = Promise.resolve();
    rejectionHandlers.forEach((handler) =>
      handler(
        new PromiseRejectionEvent('unhandledrejection', {
          promise: resolved,
          reason: new Error('rejected promise'),
        }),
      ),
    );

    await Promise.all(
      fetchMock.mock.results.map(async (result) => {
        try {
          await result.value;
        } catch {
          /* ignore */
        }
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const [, firstRequest] = fetchMock.mock.calls[0];
    const firstPayload = JSON.parse(
      (firstRequest?.body as string).split('\n')[2],
    );
    const frames = firstPayload.exception.values[0].stacktrace.frames;

    expect(firstPayload.event_id).toBe(fallbackId);
    expect(firstPayload.exception.values[0].type).toBe('Error');
    expect(frames[0].filename).toContain('first');
    expect(firstPayload.request.url).toContain('/report');
    expect(firstPayload.extra).toEqual({ step: 'manual' });
  });
});
