import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { buildApp } from '../src/index.ts';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

test('POST /auth/login -> 400 when body missing', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
    });

    assert.equal(res.statusCode, 400);
  } finally {
    await app.close();
  }
});

test('POST /auth/logout -> 200 and returns ok payload', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
    });

    assert.equal(res.statusCode, 200);

    const json = res.json() as any;
    assert.equal(json.ok, true);
  } finally {
    await app.close();
  }
});
