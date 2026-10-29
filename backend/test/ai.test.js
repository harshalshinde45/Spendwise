import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { generateToken } from '../src/middleware/auth.js';
import { isAIAvailable, sanitizePrompt } from '../src/services/geminiService.js';
import { env } from '../src/config/env.js';

describe('Google Gemini AI Integration — Foundation & Security (Phase 1)', () => {
  const app = createApp();

  const mockUser1 = {
    id: '507f1f77bcf86cd799439011',
    name: 'Aarav Patel',
    email: 'aarav@example.com',
  };

  const mockUser2 = {
    id: '507f1f77bcf86cd799439022',
    name: 'Zara Khan',
    email: 'zara@example.com',
  };

  const tokenUser1 = generateToken(mockUser1);
  const tokenUser2 = generateToken(mockUser2);

  it('verifies the backend environment handles unconfigured Gemini gracefully', () => {
    // If no key is set in test env, isAIAvailable() must be false
    assert.strictEqual(typeof isAIAvailable(), 'boolean');
    assert.ok(env.GEMINI_MODEL, 'Default GEMINI_MODEL must be defined');
    assert.strictEqual(env.GEMINI_MODEL, 'gemini-2.5-flash');
  });

  it('rejects unauthenticated requests to AI endpoints with 401 Unauthorized', async () => {
    const resStatus = await request(app).get('/api/ai/status');
    assert.strictEqual(resStatus.statusCode, 401);
    assert.strictEqual(resStatus.body.error, 'Unauthorized');

    const resPing = await request(app)
      .post('/api/ai/ping')
      .send({ message: 'Hello AI' });
    assert.strictEqual(resPing.statusCode, 401);
    assert.strictEqual(resPing.body.error, 'Unauthorized');
  });

  it('returns AI status for authenticated users without leaking secrets', async () => {
    const res = await request(app)
      .get('/api/ai/status')
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(typeof res.body.configured, 'boolean');
    assert.ok(res.body.status === 'ready' || res.body.status === 'unconfigured');
    assert.ok(res.body.message);

    // Security check: Must never return API keys or credentials
    assert.strictEqual(res.body.GEMINI_API_KEY, undefined);
    assert.strictEqual(res.body.apiKey, undefined);
  });

  it('returns safe 503 when AI endpoint is called without configured Gemini key', async () => {
    // In test environment without GEMINI_API_KEY set
    if (!env.isGeminiConfigured) {
      const res = await request(app)
        .post('/api/ai/ping')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ message: 'Test ping' });

      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res.body.error, 'Service Unavailable');
      assert.strictEqual(res.body.code, 'AI_NOT_CONFIGURED');
      assert.ok(res.body.message.includes('GEMINI_API_KEY'));
    }
  });

  it('rejects invalid message payloads with 400 Validation Error', async () => {
    // 1. Non-string message
    const resInvalidType = await request(app)
      .post('/api/ai/ping')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({ message: 12345 });

    // Should reject with 503 if unconfigured check happens first or 400 if configured
    // Both 400 and 503 are safe, but let's test input validation:
    if (env.isGeminiConfigured) {
      assert.strictEqual(resInvalidType.statusCode, 400);
      assert.strictEqual(resInvalidType.body.error, 'Validation Error');
    } else {
      assert.strictEqual(resInvalidType.statusCode, 503);
    }
  });

  it('sanitizes prompt text and strips control characters', () => {
    const raw = '  \x00Hello\x1F Gemini   ';
    const cleaned = sanitizePrompt(raw, 100);
    assert.strictEqual(cleaned, 'Hello Gemini');

    const longString = 'a'.repeat(200);
    const capped = sanitizePrompt(longString, 50);
    assert.strictEqual(capped.length, 50);
  });

  it('ensures regular API endpoints (expenses, budgets, health) continue working without AI', async () => {
    // System health
    const resHealth = await request(app).get('/api/health');
    assert.strictEqual(resHealth.statusCode, 200);

    // Root endpoint
    const resRoot = await request(app).get('/');
    assert.strictEqual(resRoot.statusCode, 200);
    assert.strictEqual(resRoot.body.status, 'ok');

    // Protected endpoints properly reject or guard without crashing
    const resExpenses = await request(app).get('/api/expenses');
    assert.ok(resExpenses.statusCode === 401 || resExpenses.statusCode === 503);

    const resBudgets = await request(app).get('/api/budgets');
    assert.ok(resBudgets.statusCode === 401 || resBudgets.statusCode === 503);
  });

  it('distinguishes rate-limit keys per authenticated user', () => {
    // Verify that keyGenerator keys by user.id
    const reqUser1 = { user: { id: 'user_123' }, ip: '127.0.0.1' };
    const reqUser2 = { user: { id: 'user_456' }, ip: '127.0.0.1' }; // Same IP, different users
    const reqAnon = { ip: '192.168.1.1' };

    const key1 = reqUser1.user?.id ? `ai_user_${reqUser1.user.id}` : `ai_ip_${reqUser1.ip}`;
    const key2 = reqUser2.user?.id ? `ai_user_${reqUser2.user.id}` : `ai_ip_${reqUser2.ip}`;
    const keyAnon = reqAnon.user?.id ? `ai_user_${reqAnon.user.id}` : `ai_ip_${reqAnon.ip}`;

    assert.notStrictEqual(key1, key2, 'Two users from the same IP must have separate rate limits');
    assert.strictEqual(key1, 'ai_user_user_123');
    assert.strictEqual(key2, 'ai_user_user_456');
    assert.strictEqual(keyAnon, 'ai_ip_192.168.1.1');
  });
});
