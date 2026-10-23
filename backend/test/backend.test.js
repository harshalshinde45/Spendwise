import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isValidCalendarDate,
  isValidMonthKey,
  isValidObjectId,
  validateExpenseInput,
  validateBudgetInput,
} from '../src/utils/validation.js';
import { requireDatabase, isDbConnected } from '../src/config/database.js';
import { getExpenses } from '../src/controllers/expenseController.js';
import { getBudgetByMonth } from '../src/controllers/budgetController.js';

function createMockReq(options = {}) {
  return {
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    method: options.method || 'GET',
    originalUrl: options.originalUrl || '/',
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

describe('Backend Validation Utilities', () => {
  it('validates calendar date format and leap years correctly', () => {
    assert.strictEqual(isValidCalendarDate('2026-10-23'), true);
    assert.strictEqual(isValidCalendarDate('2024-02-29'), true); // 2024 leap year
    assert.strictEqual(isValidCalendarDate('2023-02-29'), false); // 2023 not leap year
    assert.strictEqual(isValidCalendarDate('2026-04-31'), false); // April has 30 days
    assert.strictEqual(isValidCalendarDate('invalid-date'), false);
  });

  it('validates month key YYYY-MM correctly', () => {
    assert.strictEqual(isValidMonthKey('2026-10'), true);
    assert.strictEqual(isValidMonthKey('2025-01'), true);
    assert.strictEqual(isValidMonthKey('2026-13'), false); // Month 13 invalid
    assert.strictEqual(isValidMonthKey('2026'), false);
  });

  it('validates expense inputs strictly', () => {
    const valid = validateExpenseInput({
      amountPaise: 4500,
      category: 'Food',
      date: '2026-10-23',
      description: 'Lunch',
    });
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.sanitized.amountPaise, 4500);

    // Reject fractional paise
    const fractional = validateExpenseInput({
      amountPaise: 45.5,
      category: 'Food',
      date: '2026-10-23',
    });
    assert.strictEqual(fractional.isValid, false);

    // Reject zero or negative
    const zero = validateExpenseInput({
      amountPaise: 0,
      category: 'Food',
      date: '2026-10-23',
    });
    assert.strictEqual(zero.isValid, false);

    // Reject unknown category
    const badCat = validateExpenseInput({
      amountPaise: 1000,
      category: 'Astronomy',
      date: '2026-10-23',
    });
    assert.strictEqual(badCat.isValid, false);

    // Reject description > 120 chars
    const longDesc = validateExpenseInput({
      amountPaise: 1000,
      category: 'Food',
      date: '2026-10-23',
      description: 'a'.repeat(121),
    });
    assert.strictEqual(longDesc.isValid, false);
  });

  it('validates budget inputs correctly', () => {
    const valid = validateBudgetInput('2026-10', { amountPaise: 500000 });
    assert.strictEqual(valid.isValid, true);

    const negative = validateBudgetInput('2026-10', { amountPaise: -100 });
    assert.strictEqual(negative.isValid, false);

    const invalidMonth = validateBudgetInput('invalid-month', { amountPaise: 500000 });
    assert.strictEqual(invalidMonth.isValid, false);
  });
});

describe('Database Guards & Controller Error Responses', () => {
  it('requireDatabase blocks execution and returns 503 when database is disconnected', () => {
    assert.strictEqual(isDbConnected(), false);

    const req = createMockReq();
    const res = createMockRes();
    let nextCalled = false;

    requireDatabase(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.error, 'Database Unavailable');
  });

  it('rejects invalid month format with 400', async () => {
    const req = createMockReq({ params: { month: 'invalid-month' } });
    const res = createMockRes();

    await getBudgetByMonth(req, res, () => {});
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'Validation Error');
  });

  it('rejects invalid goal ID format with 400', async () => {
    const { updateGoal } = await import('../src/controllers/goalController.js');
    const req = createMockReq({ params: { id: 'invalid-id' }, body: { name: 'Test Goal' } });
    const res = createMockRes();

    await updateGoal(req, res, () => {});
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'Validation Error');
  });
});
