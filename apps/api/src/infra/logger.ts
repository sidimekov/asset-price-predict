import type { LoggerOptions } from 'pino';
import type { NodeEnv } from '../config/env.js';

export function buildLoggerOptions(nodeEnv: NodeEnv): LoggerOptions {
  const isDev = nodeEnv !== 'production';

  // Fastify сам создаст pino-логгер из этих опций
  return {
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    base: {
      service: 'assetpredict-api'
    },
    // В dev более читабельно (без внешних зависимостей)
    transport: isDev
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
      : undefined
  };
}
