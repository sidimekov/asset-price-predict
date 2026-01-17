import { db } from '../db/index.js';
import type { UserRow } from '../types/db.js';

export async function createUser(input: {
  email: string;
  username: string;
  passwordHash: string;
}) {
  const { email, username, passwordHash } = input;
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

export async function updateUserProfile(input: {
  id: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
}) {
  const updates: string[] = [];
  const values: Array<string> = [];
  let index = 1;

  if (input.email !== undefined) {
    updates.push(`email = $${index}`);
    values.push(input.email);
    index += 1;
  }

  if (input.username !== undefined) {
    updates.push(`username = $${index}`);
    values.push(input.username);
    index += 1;
  }

  if (input.avatarUrl !== undefined) {
    updates.push(`avatar_url = $${index}`);
    values.push(input.avatarUrl);
    index += 1;
  }

  if (updates.length === 0) return null;

  values.push(input.id);

  const result = await db.query<UserRow>(
    `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${index}
      RETURNING *
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function updateUserPassword(input: {
  id: string;
  passwordHash: string;
}) {
  const result = await db.query<UserRow>(
    `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      RETURNING *
    `,
    [input.passwordHash, input.id],
  );

  return result.rows[0] ?? null;
}
