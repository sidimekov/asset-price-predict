import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { readEnv } from '../src/config/env.ts';

test('readEnv: defaults in development', () => {
  const env = readEnv({
    NODE_ENV: 'development',
  } as any);

  assert.equal(env.nodeEnv, 'development');
  assert.equal(env.port, 8787);

  assert.ok(Array.isArray(env.corsOrigins));
  assert.ok(env.corsOrigins.includes('http://localhost:3000'));
});

test('readEnv: parses PORT and CORS_ORIGINS', () => {
  const env = readEnv({
    NODE_ENV: 'production',
    PORT: '9999',
    CORS_ORIGINS: 'https://a.com, https://b.com',
  } as any);

  assert.equal(env.nodeEnv, 'production');
  assert.equal(env.port, 9999);
  assert.deepEqual(env.corsOrigins, ['https://a.com', 'https://b.com']);
});

test('readEnv: invalid PORT falls back to default', () => {
  const env = readEnv({
    NODE_ENV: 'production',
    PORT: 'nope',
  } as any);

  assert.equal(env.port, 8787);
});
