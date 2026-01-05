import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { buildApp } from '../src/index.ts';

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

test('POST /forecast invalid body -> 400 Validation failed', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'POST',
      url: '/forecast',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ timeframe: '1d', horizon: 12 }), // нет symbol
    });

    assert.equal(res.statusCode, 400);

    const json = res.json() as any;
    assert.equal(json.error, 'Validation failed');
    assert.ok(Array.isArray(json.details));
  } finally {
    await app.close();
  }
});

test('POST /forecast valid body -> 200 and returns stub forecast', async () => {
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

    assert.equal(res.statusCode, 200);

    const json = res.json() as any;
    assert.equal(json.symbol, 'BTCUSDT');
    assert.equal(json.timeframe, '1d');
    assert.equal(json.horizon, 12);
    assert.ok(typeof json.id === 'string');
    assert.ok(typeof json.createdAt === 'string');

    assert.ok(json.series);
    assert.ok(Array.isArray(json.series.p10));
    assert.ok(Array.isArray(json.series.p50));
    assert.ok(Array.isArray(json.series.p90));
    assert.ok(Array.isArray(json.series.t));
  } finally {
    await app.close();
  }
});

test('GET /forecasts/invalid -> 500 because response validation fails', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'GET',
      url: '/forecasts/invalid',
    });

    assert.equal(res.statusCode, 500);

    const json = res.json() as any;
    assert.equal(json.error, 'Internal server error');
  } finally {
    await app.close();
  }
});

test('GET /forecasts -> 200 list stub', async () => {
  const { app } = buildApp();

  try {
    const res = await app.inject({
      method: 'GET',
      url: '/forecasts?page=1&limit=20',
    });

    assert.equal(res.statusCode, 200);

    const json = res.json() as any;
    assert.ok(Array.isArray(json.items));
    assert.equal(json.total, 0);
    assert.equal(json.page, 1);
    assert.equal(json.limit, 20);
  } finally {
    await app.close();
  }
});
