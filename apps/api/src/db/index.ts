import { Pool } from 'pg';
import type { FastifyBaseLogger } from 'fastify';

let dbHealthy = false;

const nodeEnv = process.env.NODE_ENV ?? 'development';
const defaultHost = nodeEnv === 'production' ? 'postgres' : 'localhost';

function buildConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER ?? 'postgres';
  const password = process.env.POSTGRES_PASSWORD ?? '';
  const database = process.env.POSTGRES_DB ?? 'postgres';
  const host = process.env.POSTGRES_HOST ?? defaultHost;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const port = isLocalHost
    ? (process.env.POSTGRES_PORT ?? '5432')
    : (process.env.POSTGRES_PORT_INTERNAL ?? '5432');
  const encodedPassword = encodeURIComponent(password);

  return `postgres://${user}:${encodedPassword}@${host}:${port}/${database}`;
}

export const db = new Pool({
  connectionString: buildConnectionString(),
});

db.on('error', (err) => {
  dbHealthy = false;
  console.error('Unexpected database error', err);
});

export async function checkDbConnection(logger?: FastifyBaseLogger) {
  try {
    await db.query('SELECT 1');
    dbHealthy = true;
    logger?.info('Database connection established');
  } catch (err) {
    dbHealthy = false;
    logger?.error({ err }, 'Failed to connect to database');
  }
}

export function isDbHealthy() {
  return dbHealthy;
}
