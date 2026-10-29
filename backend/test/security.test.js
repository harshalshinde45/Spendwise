import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env, getSanitizedMongoUri } from '../src/config/env.js';

describe('Security & Protection Controls', () => {
  const app = createApp();

  it('sets secure HTTP headers using Helmet on responses', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 200);
    // Helmet headers
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(res.headers['x-frame-options'], 'SAMEORIGIN');
    assert.strictEqual(res.headers['x-xss-protection'], '0');
    // Ensure X-Powered-By is omitted
    assert.strictEqual(res.headers['x-powered-by'], undefined);
  });

  it('allows whitelisted CORS origins and returns Access-Control-Allow-Origin', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'https://spendwise-nu-gilt.vercel.app');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://spendwise-nu-gilt.vercel.app');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('allows localhost developer origins in CORS', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:5173');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'http://localhost:5173');
  });

  it('blocks untrusted third-party origins from CORS', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'https://malicious-attacker-site.com');

    assert.strictEqual(res.statusCode, 200);
    // When rejected by CORS callback(null, false), Access-Control-Allow-Origin header is omitted
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
  });

  it('redacts sensitive credentials when logging MongoDB URI', () => {
    const rawUri = 'mongodb+srv://admin_user:super_secret_pw123@cluster.mongodb.net/spendwise?retryWrites=true';
    const sanitized = getSanitizedMongoUri(rawUri);
    assert.ok(!sanitized.includes('super_secret_pw123'), 'Sanitized URI must never contain password');
    assert.ok(sanitized.includes('*****'), 'Sanitized URI must mask credentials');
    assert.ok(sanitized.includes('admin_user'), 'Sanitized URI preserves user identifier');
  });

  it('rejects oversized JSON request bodies with 413 Payload Too Large', async () => {
    const bigString = 'x'.repeat(60 * 1024); // 60KB exceeds 50KB limit
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ dummy: bigString });

    assert.strictEqual(res.statusCode, 413);
  });
});
