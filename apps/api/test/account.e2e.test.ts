import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { buildApp } from '../src/index.ts';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

test('GET /account -> 401 without token', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'GET',
      url: '/account',
    });

    assert.equal(res.statusCode, 401);
  } finally {
    await app.close();
  }
});
