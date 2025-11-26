const getCryptoApi = () => {
  if (typeof globalThis === 'undefined') return null;
  const cryptoApi = globalThis.crypto;

  return cryptoApi ?? null;
};

const createId = () => {
  const cryptoApi = getCryptoApi();
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseDsn = (dsn: string) => {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace('/', '').trim();

    if (!projectId) return null;

    return {
      projectId,
      key: url.username,
      protocol: url.protocol,
      host: url.host,
      dsn: url.toString(),
    };
  } catch (error) {
    console.error('sentry dsn parse failed', error);
    return null;
  }
};

type MonitoringConfig = {
  enabled: boolean;
  dsn: string | null;
  environment: string;
  release: string | null;
};

type ParsedDsn = ReturnType<typeof parseDsn>;

type EventContext = Record<string, unknown>;

type EnvelopeEvent = {
  event_id: string;
  timestamp: string;
  platform: string;
  level: 'error' | 'info';
  environment: string;
  release?: string | null;
  message: { message: string };
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename?: string;
          function?: string;
          lineno?: number;
        }>;
      };
    }>;
  };
  extra?: EventContext;
  request?: { url?: string };
};

let monitoringConfig: MonitoringConfig = {
  enabled: false,
  dsn: null,
  environment: 'production',
  release: null,
};

let parsedDsn: ParsedDsn | null = null;
let handlersRegistered = false;

const buildAuthHeader = (key: string) =>
  `Sentry sentry_version=7, sentry_client=app-custom, sentry_key=${key}`;

const normalizeStack = (error: unknown) => {
  if (!(error instanceof Error) || !error.stack) return undefined;
  const lines = error.stack.split('\n');

  return {
    frames: lines.slice(1).map((line) => ({ filename: line.trim() })),
  };
};

const sendEnvelope = (payload: EnvelopeEvent) => {
  if (!parsedDsn) return;

  const endpoint = `${parsedDsn.protocol}//${parsedDsn.host}/api/${parsedDsn.projectId}/envelope/`;
  const envelopeHeader = {
    sent_at: new Date().toISOString(),
    dsn: parsedDsn.dsn,
  };
  const itemHeader = { type: 'event' };
  const body = `${JSON.stringify(envelopeHeader)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(payload)}`;

  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': buildAuthHeader(parsedDsn.key),
    },
    body,
    keepalive: true,
  }).catch(() => {});
};

const buildPayload = (
  message: string,
  level: 'error' | 'info',
  error?: unknown,
  extra?: EventContext,
) => {
  const stacktrace = normalizeStack(error);
  const errorValue = error instanceof Error ? error.message : String(message);
  const errorType = error instanceof Error ? error.name : 'Error';

  const requestUrl =
    typeof window !== 'undefined' ? window.location.href : undefined;

  const payload: EnvelopeEvent = {
    event_id: createId(),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level,
    environment: monitoringConfig.environment,
    release: monitoringConfig.release,
    message: { message },
    request: requestUrl ? { url: requestUrl } : undefined,
    extra,
  };

  if (level === 'error') {
    payload.exception = {
      values: [
        {
          type: errorType,
          value: errorValue,
          stacktrace,
        },
      ],
    };
  }

  return payload;
};

export const initMonitoring = () => {
  if (monitoringConfig.enabled) return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const enabledFlag = process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true';
  const isProd = process.env.NODE_ENV === 'production';

  if (!dsn || !enabledFlag || !isProd) return;

  parsedDsn = parseDsn(dsn);

  if (!parsedDsn) return;

  monitoringConfig = {
    enabled: true,
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV ||
      'production',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || null,
  };

  if (!handlersRegistered && typeof window !== 'undefined') {
    window.addEventListener('error', (event) =>
      captureException(event.error || event.message),
    );
    window.addEventListener('unhandledrejection', (event) =>
      captureException(event.reason),
    );
    handlersRegistered = true;
  }
};

export const captureException = (error: unknown, context?: EventContext) => {
  if (!monitoringConfig.enabled || !parsedDsn) return;
  const payload = buildPayload('frontend error', 'error', error, context);
  sendEnvelope(payload);
};

export const captureMessage = (message: string, context?: EventContext) => {
  if (!monitoringConfig.enabled || !parsedDsn) return;
  const payload = buildPayload(message, 'info', undefined, context);
  sendEnvelope(payload);
};

export const captureWorkerFailure = (message: string, detail?: EventContext) =>
  captureMessage(message, { source: 'worker', ...detail });

export const captureDataFailure = (message: string, detail?: EventContext) =>
  captureException(new Error(message), { source: 'data', ...detail });
