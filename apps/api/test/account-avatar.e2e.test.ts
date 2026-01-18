import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { access, rm } from 'node:fs/promises';

import { mock } from 'node:test';

import { buildApp } from '../src/index.ts';
import { signAuthToken } from '../src/modules/auth/jwt.ts';
import { buildAvatarPath, buildAvatarUrl } from '../src/config/uploads.ts';
import { db } from '../src/db/index.ts';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

function buildMultipartPayload(input: {
  fieldName: string;
  filename: string;
  contentType: string;
  data: Buffer;
}) {
  const boundary = `----formdata-${Math.random().toString(16).slice(2)}`;
  const header =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${input.fieldName}"; filename="${input.filename}"\r\n` +
    `Content-Type: ${input.contentType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const payload = Buffer.concat([
    Buffer.from(header),
    input.data,
    Buffer.from(footer),
  ]);

  return { boundary, payload };
}

test('POST /account/avatar -> 401 without token', async () => {
  const { app } = buildApp();

  try {
    const { boundary, payload } = buildMultipartPayload({
      fieldName: 'avatar',
      filename: 'avatar.webp',
      contentType: 'image/webp',
      data: Buffer.from('test'),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/account/avatar',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    assert.equal(res.statusCode, 401);
  } finally {
    await app.close();
  }
});

test('POST /account/avatar -> 400 for invalid file type', async () => {
  const { app } = buildApp();
  const token = await signAuthToken({
    sub: 'user-1',
    email: 'user@example.com',
    username: 'user',
  });

  try {
    const { boundary, payload } = buildMultipartPayload({
      fieldName: 'avatar',
      filename: 'avatar.png',
      contentType: 'image/png',
      data: Buffer.from('not-a-webp'),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/account/avatar',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    assert.equal(res.statusCode, 400);

    const json = res.json() as any;
    assert.equal(json.code, 'INVALID_FILE');
  } finally {
    await app.close();
  }
});

test('POST /account/avatar -> 200 and saves avatar', async () => {
  const { app } = buildApp();
  const userId = 'user-123';
  const avatarUrl = buildAvatarUrl(userId);
  const avatarPath = buildAvatarPath(userId);
  const token = await signAuthToken({
    sub: userId,
    email: 'user@example.com',
    username: 'user',
  });

  const queryMock = mock.method(db, 'query', async () => ({
    rows: [
      {
        id: userId,
        username: 'user',
        email: 'user@example.com',
        password_hash: 'hash',
        avatar_url: avatarUrl,
      },
    ],
  }));

  try {
    const { boundary, payload } = buildMultipartPayload({
      fieldName: 'avatar',
      filename: 'avatar.webp',
      contentType: 'image/webp',
      data: Buffer.from('webp-data'),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/account/avatar',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    assert.equal(res.statusCode, 200);

    const json = res.json() as any;
    assert.equal(json.avatarUrl, avatarUrl);

    await access(avatarPath);
  } finally {
    queryMock.mock?.restore?.();
    mock.restoreAll();
    await rm(avatarPath, { force: true });
    await app.close();
  }
});
