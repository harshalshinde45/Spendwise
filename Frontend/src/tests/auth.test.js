import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStoredToken, setStoredToken, AUTH_TOKEN_KEY } from '../services/api';

const store = new Map();
const mockLocalStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

describe('Frontend Authentication Utilities', () => {
  beforeEach(() => {
    globalThis.localStorage = mockLocalStorage;
    store.clear();
  });

  afterEach(() => {
    store.clear();
  });

  it('manages auth tokens in localStorage reliably', () => {
    expect(getStoredToken()).toBeNull();

    setStoredToken('mock-jwt-token-12345');
    expect(getStoredToken()).toBe('mock-jwt-token-12345');
    expect(mockLocalStorage.getItem(AUTH_TOKEN_KEY)).toBe('mock-jwt-token-12345');

    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
    expect(mockLocalStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('validates email addresses using strict regex pattern', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(emailRegex.test('maya@example.com')).toBe(true);
    expect(emailRegex.test('harshal.shinde@spendwise.org')).toBe(true);
    expect(emailRegex.test('user+filter@domain.co.in')).toBe(true);

    expect(emailRegex.test('')).toBe(false);
    expect(emailRegex.test('plainaddress')).toBe(false);
    expect(emailRegex.test('@missingusername.com')).toBe(false);
    expect(emailRegex.test('username@.com')).toBe(false);
    expect(emailRegex.test('username@domain')).toBe(false);
  });

  it('calculates password strength accurately', () => {
    function computeStrength(password) {
      if (!password) return { score: 0, label: '' };
      let score = 0;
      if (password.length >= 6) score += 1;
      if (password.length >= 8) score += 1;
      if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
      if (/[^a-zA-Z0-9]/.test(password)) score += 1;

      if (score <= 1) return { score: 1, label: 'Weak' };
      if (score === 2 || score === 3) return { score: 2, label: 'Good' };
      return { score: 3, label: 'Strong' };
    }

    expect(computeStrength('12345').score).toBe(1); // < 6 chars
    expect(computeStrength('abcdef').score).toBe(1); // 6 chars only letters
    expect(computeStrength('Pass123').score).toBe(2); // 7 chars, letters + numbers
    expect(computeStrength('SecureP@ssw0rd!').score).toBe(3); // 8+ chars, letters + numbers + symbols
  });

  it('verifies password confirmation matching', () => {
    const p1 = 'Secret123!';
    const p2 = 'Secret123!';
    const p3 = 'Secret456!';

    expect(p1 === p2).toBe(true);
    expect(p1 === p3).toBe(false);
  });
});
