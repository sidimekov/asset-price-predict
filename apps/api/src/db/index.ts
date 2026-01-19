import { Pool } from 'pg';
import type { FastifyBaseLogger } from 'fastify';

let dbHealthy = false;

export const db = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgres://assetpredict:assetpredict@localhost:5432/assetpredict',
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
