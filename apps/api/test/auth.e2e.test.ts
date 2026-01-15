import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { buildApp } from '../src/index.ts';

test('POST /auth/login -> 200 and returns auth payload', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
    });

    assert.equal(res.statusCode, 200);

    const json = res.json() as any;
    assert.equal(json.token, 'mock');
    assert.ok(typeof json.user?.id === 'string');
    assert.equal(json.user?.email, 'user@example.com');
    assert.equal(json.user?.username, 'Demo');
  } finally {
    await app.close();
  }
});

test('POST /auth/logout -> 200 and returns auth payload', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
    });

    assert.equal(res.statusCode, 200);

    const json = res.json() as any;
    assert.equal(json.token, 'mock');
    assert.ok(typeof json.user?.id === 'string');
  } finally {
    await app.close();
  }
});
