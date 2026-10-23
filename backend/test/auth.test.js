import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { generateToken, requireAuth } from '../src/middleware/auth.js';
import { User } from '../src/models/User.js';
import { register, login } from '../src/controllers/authController.js';

function createMockReq(options = {}) {
  return {
    headers: options.headers || {},
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    method: options.method || 'GET',
    originalUrl: options.originalUrl || '/',
    user: options.user || null,
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

describe('Authentication & Token Security', () => {
  it('generates a valid signed JWT containing user credentials', () => {
    const mockUser = {
      id: '507f1f77bcf86cd799439011',
      name: 'Priya Sharma',
      email: 'priya@example.com',
    };

    const token = generateToken(mockUser);
    assert.ok(typeof token === 'string' && token.length > 20);

    const secret = process.env.JWT_SECRET || 'spendwise_jwt_secret_dev_2026_secure';
    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.id, mockUser.id);
    assert.strictEqual(decoded.email, mockUser.email);
    assert.strictEqual(decoded.name, mockUser.name);
  });

  it('requireAuth rejects requests without authorization header with 401', () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
  });

  it('requireAuth rejects invalid or forged JWT tokens with 401', () => {
    const req = createMockReq({
      headers: { authorization: 'Bearer invalid.forged.token' },
    });
    const res = createMockRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
  });

  it('requireAuth accepts valid token and populates req.user', () => {
    const mockUser = {
      id: '507f1f77bcf86cd799439011',
      name: 'Harshal Shinde',
      email: 'harshal@example.com',
    };
    const token = generateToken(mockUser);

    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.id, mockUser.id);
    assert.strictEqual(req.user.email, mockUser.email);
    assert.strictEqual(req.user.name, mockUser.name);
  });

  it('User model securely hashes passwords and verifies candidate matching', async () => {
    const plain = 'StrongPass123!';
    const hash = await User.hashPassword(plain);

    assert.notStrictEqual(hash, plain);
    assert.ok(hash.startsWith('$2')); // bcrypt salt format

    const userInstance = new User({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: hash,
    });

    const isCorrect = await userInstance.comparePassword(plain);
    const isWrong = await userInstance.comparePassword('WrongPassword123');

    assert.strictEqual(isCorrect, true);
    assert.strictEqual(isWrong, false);

    // Verify passwordHash is never leaked in JSON
    const json = userInstance.toJSON();
    assert.strictEqual(json.passwordHash, undefined);
    assert.strictEqual(json.__v, undefined);
  });

  it('registration validates inputs strictly and rejects invalid formats', async () => {
    // Missing name
    const req1 = createMockReq({ body: { email: 'user@example.com', password: 'password123' } });
    const res1 = createMockRes();
    await register(req1, res1, () => {});
    assert.strictEqual(res1.statusCode, 400);
    assert.strictEqual(res1.body.error, 'Validation Error');

    // Invalid email
    const req2 = createMockReq({ body: { name: 'Alice', email: 'invalid-email', password: 'password123' } });
    const res2 = createMockRes();
    await register(req2, res2, () => {});
    assert.strictEqual(res2.statusCode, 400);
    assert.strictEqual(res2.body.error, 'Validation Error');

    // Short password (< 6 chars)
    const req3 = createMockReq({ body: { name: 'Alice', email: 'alice@example.com', password: '123' } });
    const res3 = createMockRes();
    await register(req3, res3, () => {});
    assert.strictEqual(res3.statusCode, 400);
    assert.strictEqual(res3.body.error, 'Validation Error');
  });

  it('login rejects missing credentials with 400', async () => {
    // Missing email
    const req1 = createMockReq({ body: { password: 'password123' } });
    const res1 = createMockRes();
    await login(req1, res1, () => {});
    assert.strictEqual(res1.statusCode, 400);
    assert.strictEqual(res1.body.error, 'Validation Error');

    // Missing password
    const req2 = createMockReq({ body: { email: 'user@example.com' } });
    const res2 = createMockRes();
    await login(req2, res2, () => {});
    assert.strictEqual(res2.statusCode, 400);
    assert.strictEqual(res2.body.error, 'Validation Error');
  });
});
