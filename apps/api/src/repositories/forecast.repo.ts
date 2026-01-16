import { db } from '../db/index.js';
import type { ForecastInsert, ForecastRow, Pagination } from '../types/db.js';

export async function insertForecast(forecast: ForecastInsert) {
  const result = await db.query<ForecastRow>(
    `
      INSERT INTO forecasts (
        user_id,
        symbol,
        timeframe,
        horizon,
        series,
        metrics,
        factors,
        provider,
        model,
        window,
        params
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
    [
      forecast.userId,
      forecast.symbol,
      forecast.timeframe,
      String(forecast.horizon),
      forecast.series,
      forecast.metrics ?? null,
      forecast.factors ?? null,
      forecast.provider ?? null,
      forecast.model ?? null,
      forecast.window ?? null,
      forecast.params ?? null,
    ],
  );

  return result.rows[0] ?? null;
}

export async function getForecastById(id: string, userId: string) {
  const result = await db.query<ForecastRow>(
    `
      SELECT *
      FROM forecasts
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [id, userId],
  );

  return result.rows[0] ?? null;
}

export async function listForecasts(
  userId: string,
  { page, limit }: Pagination,
) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * safeLimit;

  const result = await db.query<ForecastRow>(
    `
      SELECT *
      FROM forecasts
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      OFFSET $3
    `,
    [userId, safeLimit, offset],
  );

  return result.rows;
}

export async function countForecasts(userId: string) {
  const result = await db.query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM forecasts
      WHERE user_id = $1
    `,
    [userId],
  );

  const total = result.rows[0]?.total ?? '0';
  return Number(total);
}
