import type { LoginReq, LoginRes, RegisterReq } from '@assetpredict/shared';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import {
  createUser,
  findUserByEmail,
} from '../../repositories/user.repo.js';
import type { UserRow } from '../../types/db.js';
import { signAuthToken } from './jwt.js';

const PASSWORD_HASH_KEYLEN = 64;

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64');
  const hash = scryptSync(password, salt, PASSWORD_HASH_KEYLEN).toString(
    'base64',
  );
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [algo, salt, expected] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !expected) return false;
  const derived = scryptSync(password, salt, PASSWORD_HASH_KEYLEN).toString(
    'base64',
  );
  return (
    derived.length === expected.length &&
    timingSafeEqual(Buffer.from(derived), Buffer.from(expected))
  );
}

function deriveUsername(email: string) {
  const [local] = email.split('@');
  const trimmed = local?.trim();
  if (trimmed && trimmed.length >= 3) return trimmed;
  return `user-${randomBytes(4).toString('hex')}`;
}

export class AuthError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function toAuthUser(user: UserRow, fallbackEmail?: string): LoginRes['user'] {
  const email = user.email ?? fallbackEmail;
  if (!email) {
    throw new AuthError(500, 'User email missing');
  }

  return {
    id: user.id as LoginRes['user']['id'],
    email,
    username: user.username,
    avatarUrl: user.avatar_url ?? undefined,
  };
}

export class AuthService {
  async register(input: RegisterReq): Promise<LoginRes> {
    const emailUser = await findUserByEmail(input.email);

    if (emailUser) {
      throw new AuthError(409, 'Email already in use');
    }

    const passwordHash = hashPassword(input.password);
    const username = input.username?.trim() || deriveUsername(input.email);
    const user = await createUser({
      email: input.email,
      username,
      passwordHash,
    });

    if (!user) {
      throw new AuthError(500, 'Failed to create user');
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email ?? input.email,
      username: user.username,
    });

    return { user: toAuthUser(user, input.email), token };
  }

  async login(input: LoginReq): Promise<LoginRes> {
    const user = await findUserByEmail(input.email);

    if (!user) {
      throw new AuthError(401, 'Invalid credentials');
    }

    const matches = verifyPassword(input.password, user.password_hash);
    if (!matches) {
      throw new AuthError(401, 'Invalid credentials');
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email ?? input.email,
      username: user.username,
    });

    return { user: toAuthUser(user, input.email), token };
  }
}
