import { db } from '../db/index.js';
import type { UserRow } from '../types/db.js';

export async function createUser(email: string, passwordHash: string) {
  const username = email;
  const result = await db.query<UserRow>(
    `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [username, email, passwordHash],
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string) {
  const result = await db.query<UserRow>(
    `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await db.query<UserRow>(
    `
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
