import Fastify from 'fastify';
import cors from '@fastify/cors';

import { readEnv } from './config/env.js';
import { buildLoggerOptions } from './infra/logger.js';
import { registerErrorHandler } from './infra/errorHandler.js';

export function buildApp() {
  const env = readEnv();

  const app = Fastify({
    logger: buildLoggerOptions(env.nodeEnv),
    // requestId склеивает логи и ответы
    genReqId: () => crypto.randomUUID(),
  });

  // Базовые плагины
  app.register(cors, {
    origin: (origin, cb) => {
      // Без Origin (curl/postman)
      if (!origin) return cb(null, true);

      // В dev разрешаем из списка
      // в prod список задаётся через ENV
      if (env.corsOrigins.includes(origin)) return cb(null, true);

      // логировать отказ
      app.log.warn({ origin }, 'CORS origin rejected');
      return cb(new Error('CORS not allowed'), false);
    },
    credentials: true,
  });

  registerErrorHandler(app);

  // жив ли сервер (удобно для dev/CI),
  app.get('/health', async () => {
    return { status: 'ok', version: '0.1.0' };
  });

  return { app, env };
}

async function main() {
  const { app, env } = buildApp();

  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info({ port: env.port, nodeEnv: env.nodeEnv }, 'API started');
  } catch (err) {
    app.log.error({ err }, 'Failed to start API');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
