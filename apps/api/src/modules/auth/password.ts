import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PASSWORD_HASH_KEYLEN = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64');
  const hash = scryptSync(password, salt, PASSWORD_HASH_KEYLEN).toString(
    'base64',
  );
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
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
