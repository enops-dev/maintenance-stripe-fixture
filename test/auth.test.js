const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');

function request(server, method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      { port: server.address().port, method, path, headers: { 'content-type': 'application/json', ...headers } },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(buf) }));
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function withServer(fn) {
  const server = createApp().listen(0);
  try { await fn(server); } finally { server.close(); }
}

test('login token round-trips through /auth/me', () => withServer(async (s) => {
  const l = await request(s, 'POST', '/auth/login', { username: 'ada' });
  assert.strictEqual(l.status, 200);
  const m = await request(s, 'GET', '/auth/me', null, { authorization: `Bearer ${l.body.token}` });
  assert.deepStrictEqual(m.body, { user: 'ada' });
}));

test('/auth/me rejects unsigned alg=none token', () => withServer(async (s) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'mallory' })}.`;
  const r = await request(s, 'GET', '/auth/me', null, { authorization: `Bearer ${token}` });
  assert.strictEqual(r.status, 401);
  assert.deepStrictEqual(r.body, { error: 'invalid token' });
}));

test('/auth/me rejects token signed with a different key', () => withServer(async (s) => {
  const token = jwt.sign({ sub: 'mallory' }, 'not-the-server-secret', { algorithm: 'HS256' });
  const r = await request(s, 'GET', '/auth/me', null, { authorization: `Bearer ${token}` });
  assert.strictEqual(r.status, 401);
  assert.deepStrictEqual(r.body, { error: 'invalid token' });
}));
