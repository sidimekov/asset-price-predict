import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { buildApp } from '../src/index.ts';

test('GET /account -> 200 and returns account profile', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'GET',
      url: '/account',
    });

    assert.equal(res.statusCode, 200);

    const json = res.json() as any;
    assert.ok(typeof json.id === 'string');
    assert.equal(json.username, 'Demo');
    assert.equal(json.login, 'demo');
    assert.equal(json.email, 'demo@example.com');
  } finally {
    await app.close();
  }
});
