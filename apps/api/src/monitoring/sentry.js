import { randomUUID } from 'node:crypto';

const getUrlCtor = () =>
  typeof globalThis !== 'undefined' ? globalThis.URL : null;
const getFetchApi = () =>
  typeof globalThis !== 'undefined' ? globalThis.fetch : null;

const parseDsn = (dsn) => {
  const UrlCtor = getUrlCtor();

  if (!UrlCtor) return null;

  try {
    const url = new UrlCtor(dsn);
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

const buildAuthHeader = (key) =>
  `Sentry sentry_version=7, sentry_client=api-custom, sentry_key=${key}`;

const createId = () => randomUUID();

const normalizeStack = (error) => {
  if (!(error instanceof Error) || !error.stack) return undefined;
  const lines = error.stack.split('\n');

  return {
    frames: lines.slice(1).map((line) => ({ filename: line.trim() })),
  };
};

const buildPayload = (message, level, context = {}, error) => {
  const payload = {
    event_id: createId(),
    timestamp: new Date().toISOString(),
    platform: 'node',
    level,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
    release: process.env.SENTRY_RELEASE || null,
    message: { message },
    extra: context,
  };

  if (error) {
    payload.exception = {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: normalizeStack(error),
        },
      ],
    };
  }

  return payload;
};

let dsnConfig = null;

const sendEnvelope = (payload) => {
  if (!dsnConfig) return;

  const fetchApi = getFetchApi();
  if (!fetchApi) return;

  const endpoint = `${dsnConfig.protocol}//${dsnConfig.host}/api/${dsnConfig.projectId}/envelope/`;
  const envelopeHeader = {
    sent_at: new Date().toISOString(),
    dsn: dsnConfig.dsn,
  };
  const itemHeader = { type: 'event' };
  const body = `${JSON.stringify(envelopeHeader)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(payload)}`;

  fetchApi(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': buildAuthHeader(dsnConfig.key),
    },
    body,
  }).catch(() => {});
};

export const initMonitoring = () => {
  if (dsnConfig) return true;

  const dsn = process.env.SENTRY_DSN;
  const enabledFlag = process.env.SENTRY_ENABLED === 'true';
  const isProd = process.env.NODE_ENV === 'production';

  if (!dsn || !enabledFlag || !isProd) return false;

  dsnConfig = parseDsn(dsn);
  return Boolean(dsnConfig);
};

export const captureServerException = (error, context = {}) => {
  if (!dsnConfig) return;
  const payload = buildPayload('backend error', 'error', context, error);
  sendEnvelope(payload);
};

export const captureServerMessage = (message, context = {}) => {
  if (!dsnConfig) return;
  const payload = buildPayload(message, 'info', context);
  sendEnvelope(payload);
};

export const bindProcessMonitoring = () => {
  if (!dsnConfig) return;

  process.on('uncaughtException', (error) => {
    captureServerException(error, { source: 'uncaught' });
  });

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    captureServerException(error, { source: 'rejection' });
  });
};
