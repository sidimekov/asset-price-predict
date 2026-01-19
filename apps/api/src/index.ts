import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';

import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

import { readEnv } from './config/env.js';
import { MAX_AVATAR_SIZE, uploadRoot } from './config/uploads.js';
import { buildLoggerOptions } from './infra/logger.js';
import { registerErrorHandler } from './infra/errorHandler.js';
import { registerRouter } from './http/router.js';
import { checkDbConnection } from './db/index.js';

export function buildApp() {
  const env = readEnv();

  const app = Fastify({
    logger: buildLoggerOptions(env.nodeEnv),
    genReqId: () => randomUUID(),
  });

  // Плагины
  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (env.corsOrigins.includes('*')) return cb(null, true);
      if (env.corsOrigins.includes(origin)) return cb(null, true);
      app.log.warn({ origin }, 'CORS origin rejected');
      return cb(new Error('CORS not allowed'), false);
    },
    credentials: true,
  });

  app.register(multipart, {
    limits: { fileSize: MAX_AVATAR_SIZE },
  });
  mkdirSync(uploadRoot, { recursive: true });
  app.register(fastifyStatic, {
    root: uploadRoot,
    prefix: '/files/',
    decorateReply: false,
  });

  registerErrorHandler(app);

  // Роутер
  registerRouter(app);

  return { app, env };
}

async function main() {
  const { app, env } = buildApp();

  await checkDbConnection(app.log);

  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info({ port: env.port, nodeEnv: env.nodeEnv }, 'API started');
  } catch (err) {
    app.log.error({ err }, 'Failed to start API');
    process.exit(1);
  }
}

const isEntrypoint = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
})();

if (isEntrypoint) {
  void main();
}
