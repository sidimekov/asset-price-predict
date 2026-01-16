import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { buildApp } from '../src/index.ts';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

test('GET /health -> 200 and ok', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(res.statusCode, 200);

    const json = res.json() as any;
    assert.equal(json.status, 'ok');
    assert.ok(typeof json.version === 'string');
  } finally {
    await app.close();
  }
});

test('POST /forecast invalid body -> 401 Unauthorized', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'POST',
      url: '/forecast',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ timeframe: '1d', horizon: 12 }), // нет symbol
    });

    assert.equal(res.statusCode, 401);
  } finally {
    await app.close();
  }
});

test('POST /forecast valid body -> 401 Unauthorized', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'POST',
      url: '/forecast',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({
        symbol: 'BTCUSDT',
        timeframe: '1d',
        horizon: 12,
      }),
    });

    assert.equal(res.statusCode, 401);
  } finally {
    await app.close();
  }
});

test('GET /forecasts/invalid -> 401 Unauthorized', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'GET',
      url: '/forecasts/invalid',
    });

    assert.equal(res.statusCode, 401);
  } finally {
    await app.close();
  }
});

test('GET /forecasts -> 401 Unauthorized', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'GET',
      url: '/forecasts?page=1&limit=20',
    });

    assert.equal(res.statusCode, 401);
  } finally {
    await app.close();
  }
});
