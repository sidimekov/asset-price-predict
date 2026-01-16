import { createHmac, timingSafeEqual } from 'node:crypto';

import { readEnv } from '../../config/env.js';
import { UserId } from '@assetpredict/shared';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  username: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
};

let cachedConfig: ReturnType<typeof readEnv> | null = null;

function getJwtConfig() {
  if (!cachedConfig) {
    cachedConfig = readEnv();
  }
  return cachedConfig;
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  return Buffer.from(padded, 'base64');
}

function parseExpiresIn(value: string): number {
  const trimmed = value.trim();
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return Math.floor(asNumber);
  }

  const match = trimmed.match(/^(\d+)([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier =
    unit === 's'
      ? 1
      : unit === 'm'
        ? 60
        : unit === 'h'
          ? 60 * 60
          : 24 * 60 * 60;

  return amount * multiplier;
}

function sign(data: string) {
  const { jwtSecret } = getJwtConfig();
  return base64UrlEncode(createHmac('sha256', jwtSecret).update(data).digest());
}

export async function signAuthToken(payload: AuthTokenPayload) {
  const { jwtExpiresIn } = getJwtConfig();
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = parseExpiresIn(jwtExpiresIn);
  const body: JwtPayload = {
    sub: payload.sub,
    email: payload.email,
    username: payload.username,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };
  const bodyEncoded = base64UrlEncode(JSON.stringify(body));
  const data = `${header}.${bodyEncoded}`;
  const signature = sign(data);
  return `${data}.${signature}`;
}

export async function verifyAuthToken(token: string) {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    throw new Error('Invalid token');
  }

  const data = `${header}.${payload}`;
  const expected = sign(data);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    throw new Error('Invalid token signature');
  }

  const decoded = JSON.parse(
    base64UrlDecode(payload).toString('utf8'),
  ) as JwtPayload;
  if (
    typeof decoded.sub !== 'string' ||
    typeof decoded.email !== 'string' ||
    typeof decoded.username !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof decoded.exp !== 'number' || decoded.exp < now) {
    throw new Error('Token expired');
  }

  return {
    id: decoded.sub as UserId,
    email: decoded.email,
    username: decoded.username,
  };
}
