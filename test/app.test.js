const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { createApp } = require('../src/app');

const calls = [];
const fakeStripe = {
  charges: { create: async (p) => { calls.push(['charge', p]); return { id: 'ch_1', status: 'succeeded' }; } },
  sources: { create: async (p) => { calls.push(['source', p]); return { id: 'src_1' }; } },
  customers: { createSource: async (c, p) => { calls.push(['attach', c, p]); return { id: 'card_1' }; } },
};

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
  const server = createApp(fakeStripe).listen(0);
  try { await fn(server); } finally { server.close(); }
}

test('GET /health', () => withServer(async (s) => {
  const r = await request(s, 'GET', '/health');
  assert.deepStrictEqual(r.body, { ok: true });
}));

test('POST /billing/charge', () => withServer(async (s) => {
  const r = await request(s, 'POST', '/billing/charge', { amount: 500, currency: 'usd', source: 'tok_visa' });
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(r.body, { id: 'ch_1', status: 'succeeded' });
  assert.deepStrictEqual(calls.at(-1), ['charge', { amount: 500, currency: 'usd', source: 'tok_visa' }]);
}));

test('POST /billing/card', () => withServer(async (s) => {
  const r = await request(s, 'POST', '/billing/card', { token: 'tok_1', customerId: 'cus_1' });
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(r.body, { id: 'card_1' });
  assert.deepStrictEqual(calls.at(-1), ['attach', 'cus_1', { source: 'src_1' }]);
}));

test('login then /auth/me', () => withServer(async (s) => {
  const l = await request(s, 'POST', '/auth/login', { username: 'ada' });
  assert.strictEqual(l.status, 200);
  const m = await request(s, 'GET', '/auth/me', null, { authorization: `Bearer ${l.body.token}` });
  assert.deepStrictEqual(m.body, { user: 'ada' });
  const bad = await request(s, 'GET', '/auth/me', null, { authorization: 'Bearer nope' });
  assert.strictEqual(bad.status, 401);
}));
