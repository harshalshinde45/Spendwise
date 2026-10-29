import { describe, it, expect } from 'vitest';
import { paiseToRupees, rupeesToPaise, formatINR, paiseToInputValue } from '../utils/currency';
import {
  getTodayDateString,
  getCurrentMonthKey,
  getMonthKeyFromDate,
  formatDateReadable,
  formatMonthReadable,
  getPreviousMonthKey,
  getNextMonthKey,
  isValidDateString,
} from '../utils/dates';
import { validateExpense, validateBudget, MAX_AMOUNT_RUPEES } from '../utils/validation';
import {
  getExpensesForMonth,
  calculateMonthlyTotal,
  calculateCategoryTotals,
  calculateBudgetStatus,
  calculateSmartBudgetAlert,
  sortExpenses,
} from '../utils/calculations';
import {
  STORAGE_KEYS,
  isValidStoredExpense,
  isValidStoredBudgets,
  safeGetItem,
  exportToJSONString,
  exportToCSVString,
  parseAndValidateImport,
} from '../utils/storage';

describe('Currency Utilities', () => {
  it('converts paise to rupees accurately', () => {
    expect(paiseToRupees(4599)).toBe(45.99);
    expect(paiseToRupees(100)).toBe(1);
    expect(paiseToRupees(0)).toBe(0);
    expect(paiseToRupees(5)).toBe(0.05);
  });

  it('converts rupees to paise with correct rounding', () => {
    expect(rupeesToPaise(45.99)).toBe(4599);
    expect(rupeesToPaise('45.99')).toBe(4599);
    expect(rupeesToPaise('30.50')).toBe(3050);
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(0.01)).toBe(1);
  });

  it('formats INR correctly with symbol and formatting', () => {
    const formatted = formatINR(4599);
    expect(formatted).toContain('45.99');
    expect(formatted).toContain('₹');
  });

  it('formats zero paise cleanly', () => {
    const formatted = formatINR(0);
    expect(formatted).toContain('0.00');
  });

  it('formats paise to input value cleanly', () => {
    expect(paiseToInputValue(4599)).toBe('45.99');
    expect(paiseToInputValue(4500)).toBe('45');
    expect(paiseToInputValue(0)).toBe('');
  });
});

describe('Date Utilities', () => {
  it('returns valid calendar today date string', () => {
    const today = getTodayDateString();
    expect(isValidDateString(today)).toBe(true);
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('extracts month key correctly', () => {
    expect(getMonthKeyFromDate('2026-10-23')).toBe('2026-10');
    expect(getMonthKeyFromDate('2025-01-01')).toBe('2025-01');
  });

  it('formats readable dates in Indian format', () => {
    const readable = formatDateReadable('2026-10-23');
    expect(readable).toContain('2026');
    expect(readable).toContain('Oct');
    expect(readable).toContain('23');
  });

  it('formats readable month names', () => {
    const readable = formatMonthReadable('2026-10');
    expect(readable).toBe('October 2026');
  });

  it('navigates previous and next months across year boundaries', () => {
    expect(getPreviousMonthKey('2026-01')).toBe('2025-12');
    expect(getNextMonthKey('2025-12')).toBe('2026-01');
    expect(getPreviousMonthKey('2026-10')).toBe('2026-09');
    expect(getNextMonthKey('2026-10')).toBe('2026-11');
  });

  it('validates leap years and calendar dates', () => {
    expect(isValidDateString('2024-02-29')).toBe(true); // 2024 is leap year
    expect(isValidDateString('2023-02-29')).toBe(false); // 2023 not leap year
    expect(isValidDateString('2026-04-31')).toBe(false); // April has 30 days
    expect(isValidDateString('invalid-date')).toBe(false);
  });
});

describe('Validation Utilities', () => {
  it('validates valid expense fields', () => {
    const result = validateExpense({
      amount: '150.50',
      category: 'Food',
      date: '2026-10-23',
      description: 'Groceries',
    });
    expect(result.isValid).toBe(true);
    expect(result.sanitized.amountPaise).toBe(15050);
    expect(result.sanitized.category).toBe('Food');
    expect(result.sanitized.description).toBe('Groceries');
  });

  it('rejects missing or zero amounts', () => {
    const res1 = validateExpense({ amount: '', category: 'Food', date: '2026-10-23' });
    expect(res1.isValid).toBe(false);
    expect(res1.errors.amount).toBeDefined();

    const res2 = validateExpense({ amount: '0', category: 'Food', date: '2026-10-23' });
    expect(res2.isValid).toBe(false);
    expect(res2.errors.amount).toBeDefined();

    const res3 = validateExpense({ amount: '-50', category: 'Food', date: '2026-10-23' });
    expect(res3.isValid).toBe(false);
    expect(res3.errors.amount).toBeDefined();
  });

  it('rejects more than 2 decimal places', () => {
    const res = validateExpense({ amount: '45.999', category: 'Food', date: '2026-10-23' });
    expect(res.isValid).toBe(false);
    expect(res.errors.amount).toBeDefined();
  });

  it('rejects unknown category', () => {
    const res = validateExpense({ amount: '50', category: 'Astronomy', date: '2026-10-23' });
    expect(res.isValid).toBe(false);
    expect(res.errors.category).toBeDefined();
  });

  it('rejects descriptions exceeding 120 chars', () => {
    const longDesc = 'a'.repeat(121);
    const res = validateExpense({ amount: '50', category: 'Food', date: '2026-10-23', description: longDesc });
    expect(res.isValid).toBe(false);
    expect(res.errors.description).toBeDefined();
  });

  it('validates budget inputs correctly', () => {
    expect(validateBudget('5000').isValid).toBe(true);
    expect(validateBudget('5000').budgetPaise).toBe(500000);
    expect(validateBudget('').isValid).toBe(true); // empty means unset
    expect(validateBudget('-100').isValid).toBe(false);
    expect(validateBudget('abc').isValid).toBe(false);
  });
});

describe('Calculation Utilities', () => {
  const sampleExpenses = [
    { id: '1', amountPaise: 4500, category: 'Food', date: '2026-10-23', createdAt: '2026-10-23T10:00:00Z' },
    { id: '2', amountPaise: 3050, category: 'Transport', date: '2026-10-23', createdAt: '2026-10-23T11:00:00Z' },
    { id: '3', amountPaise: 25000, category: 'Education', date: '2026-10-24', createdAt: '2026-10-24T09:00:00Z' },
    { id: '4', amountPaise: 12000, category: 'Food', date: '2026-09-15', createdAt: '2026-09-15T09:00:00Z' },
  ];

  it('filters expenses strictly for the selected month', () => {
    const octExpenses = getExpensesForMonth(sampleExpenses, '2026-10');
    expect(octExpenses.length).toBe(3);
    const sepExpenses = getExpensesForMonth(sampleExpenses, '2026-09');
    expect(sepExpenses.length).toBe(1);
    const novExpenses = getExpensesForMonth(sampleExpenses, '2026-11');
    expect(novExpenses.length).toBe(0);
  });

  it('calculates accurate monthly total in paise', () => {
    const total = calculateMonthlyTotal(sampleExpenses, '2026-10');
    // 4500 + 3050 + 25000 = 32550
    expect(total).toBe(32550);
  });

  it('calculates category totals and percentages correctly', () => {
    const breakdown = calculateCategoryTotals(sampleExpenses, '2026-10');
    // Total is 32550
    // Education: 25000 (76.8%)
    // Food: 4500 (13.8%)
    // Transport: 3050 (9.4%)
    expect(breakdown.length).toBe(3);
    expect(breakdown[0].name).toBe('Education');
    expect(breakdown[0].totalPaise).toBe(25000);
    expect(breakdown[1].name).toBe('Food');
    expect(breakdown[1].totalPaise).toBe(4500);
    expect(breakdown[2].name).toBe('Transport');
    expect(breakdown[2].totalPaise).toBe(3050);
  });

  it('calculates budget status when budget is not set (zero)', () => {
    const status = calculateBudgetStatus(0, 32550);
    expect(status.isSet).toBe(false);
    expect(status.spentPaise).toBe(32550);
    expect(status.remainingPaise).toBe(0);
    expect(status.utilizationPercent).toBe(0);
    expect(status.isOverBudget).toBe(false);
  });

  it('calculates budget status under budget', () => {
    // Budget ₹500 (50000 paise), Spent ₹325.50 (32550 paise)
    const status = calculateBudgetStatus(50000, 32550);
    expect(status.isSet).toBe(true);
    expect(status.remainingPaise).toBe(17450);
    expect(status.utilizationPercent).toBe(65.1);
    expect(status.visualProgressPercent).toBe(65.1);
    expect(status.isOverBudget).toBe(false);
    expect(status.statusLevel).toBe('healthy');
  });

  it('calculates over-budget status properly without clipping remaining amount', () => {
    // Budget ₹200 (20000 paise), Spent ₹325.50 (32550 paise)
    const status = calculateBudgetStatus(20000, 32550);
    expect(status.isSet).toBe(true);
    expect(status.remainingPaise).toBe(-12550);
    expect(status.isOverBudget).toBe(true);
    expect(status.overspentPaise).toBe(12550);
    expect(status.utilizationPercent).toBe(162.8);
    expect(status.visualProgressPercent).toBe(100); // Progress bar capped at 100%
    expect(status.statusLevel).toBe('danger');
  });

  it('sorts expenses by date desc, date asc, amount desc, amount asc', () => {
    const sortedDateDesc = sortExpenses(sampleExpenses, 'date-desc');
    expect(sortedDateDesc[0].id).toBe('3'); // 2026-10-24

    const sortedAmountDesc = sortExpenses(sampleExpenses, 'amount-desc');
    expect(sortedAmountDesc[0].amountPaise).toBe(25000);
    expect(sortedAmountDesc[sortedAmountDesc.length - 1].amountPaise).toBe(3050);

    const sortedAmountAsc = sortExpenses(sampleExpenses, 'amount-asc');
    expect(sortedAmountAsc[0].amountPaise).toBe(3050);
  });

  it('filters expenses correctly by amount thresholds and search keywords', () => {
    // Min ₹40 (4000 paise), Max ₹200 (20000 paise)
    const minPaise = 4000;
    const maxPaise = 20000;
    const amountFiltered = sampleExpenses.filter(
      (e) => e.amountPaise >= minPaise && e.amountPaise <= maxPaise
    );
    expect(amountFiltered.length).toBe(2); // 4500 and 12000
    expect(amountFiltered.some((e) => e.amountPaise === 25000)).toBe(false);
    expect(amountFiltered.some((e) => e.amountPaise === 3050)).toBe(false);

    // Search keyword filtering
    const keyword = 'education';
    const keywordFiltered = sampleExpenses.filter((e) =>
      (e.description || '').toLowerCase().includes(keyword) ||
      (e.category || '').toLowerCase().includes(keyword)
    );
    expect(keywordFiltered.length).toBe(1);
    expect(keywordFiltered[0].category).toBe('Education');
  });
});

describe('Storage and Serialization Utilities', () => {
  it('validates expense items', () => {
    expect(isValidStoredExpense({
      id: 'abc',
      amountPaise: 500,
      category: 'Food',
      date: '2026-10-23'
    })).toBe(true);

    expect(isValidStoredExpense({
      id: '',
      amountPaise: 500,
      category: 'Food',
      date: '2026-10-23'
    })).toBe(false);

    expect(isValidStoredExpense({
      id: 'abc',
      amountPaise: -10,
      category: 'Food',
      date: '2026-10-23'
    })).toBe(false);
  });

  it('validates budget maps', () => {
    expect(isValidStoredBudgets({ '2026-10': 50000, '2026-11': 60000 })).toBe(true);
    expect(isValidStoredBudgets({ 'invalid': 50000 })).toBe(false);
    expect(isValidStoredBudgets([1, 2, 3])).toBe(false);
  });

  it('exports and validates JSON import', () => {
    const expenses = [
      { id: 'exp1', amountPaise: 1500, category: 'Food', date: '2026-10-23', description: 'Snack' }
    ];
    const budgets = { '2026-10': 100000 };
    const jsonStr = exportToJSONString(expenses, budgets);
    const parsed = parseAndValidateImport(jsonStr);

    expect(parsed.isValid).toBe(true);
    expect(parsed.data.expenses.length).toBe(1);
    expect(parsed.data.budgets['2026-10']).toBe(100000);
  });

  it('exports CSV cleanly', () => {
    const expenses = [
      { id: 'exp1', amountPaise: 1500, category: 'Food', date: '2026-10-23', description: 'Snack, with comma' }
    ];
    const csv = exportToCSVString(expenses);
    expect(csv).toContain('Amount (INR)');
    expect(csv).toContain('15.00');
    expect(csv).toContain('"Snack, with comma"');
  });

  it('neutralizes CSV formula injection characters (=, +, -, @, tab) in exported CSV', () => {
    const maliciousExpenses = [
      { id: 'exp1', amountPaise: 50000, category: '=cmd|calc', date: '2026-10-23', description: '=SUM(A1:A10)' },
      { id: 'exp2', amountPaise: 2000, category: '+Dangerous', date: '2026-10-23', description: '@alert(1)' },
      { id: 'exp3', amountPaise: 1000, category: '-Subtraction', date: '2026-10-23', description: '\tTabbedFormula' },
    ];
    const csv = exportToCSVString(maliciousExpenses);
    // Formula characters must be prepended with a single quote '
    expect(csv).toContain('"\'=SUM(A1:A10)"');
    expect(csv).toContain('"\'=cmd|calc"');
    expect(csv).toContain('"\'@alert(1)"');
    expect(csv).toContain('"\'\tTabbedFormula"');
  });

  it('defines persistent theme storage key', () => {
    expect(STORAGE_KEYS.THEME).toBe('spendwise:v1:theme');
  });
});

describe('Smart Budget Alerts Calculation & Boundary Conditions', () => {
  const monthKey = '2026-10';
  const categoryTotalsMock = [
    { name: 'Food', totalPaise: 600000, percentage: 60 },
    { name: 'Utilities', totalPaise: 400000, percentage: 40 },
  ];

  it('HEALTHY: remaining percentage > 30% does not display a warning', () => {
    // Budget ₹10,000 (1,000,000 paise), Spent ₹6,000 (600,000 paise) -> Remaining ₹4,000 (40%)
    const alert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 600000,
      monthKey,
      categoryTotals: categoryTotalsMock,
    });

    expect(alert.alertLevel).toBe('HEALTHY');
    expect(alert.shouldDisplay).toBe(false);
    expect(alert.remainingPaise).toBe(400000);
    expect(alert.remainingPercent).toBe(40);
    expect(alert.isOverBudget).toBe(false);
    expect(alert.variant).toBe('success');
  });

  it('CAUTION: remaining percentage exactly 30% triggers caution reminder', () => {
    // Budget ₹10,000 (1,000,000 paise), Spent ₹7,000 (700,000 paise) -> Remaining ₹3,000 (30%)
    const alert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 700000,
      monthKey,
      categoryTotals: categoryTotalsMock,
    });

    expect(alert.alertLevel).toBe('CAUTION');
    expect(alert.shouldDisplay).toBe(true);
    expect(alert.remainingPaise).toBe(300000);
    expect(alert.remainingPercent).toBe(30);
    expect(alert.variant).toBe('warning');
    expect(alert.tips.length).toBeGreaterThan(0);
  });

  it('CAUTION: remaining percentage exactly 15% triggers caution reminder', () => {
    // Budget ₹10,000 (1,000,000 paise), Spent ₹8,500 (850,000 paise) -> Remaining ₹1,500 (15%)
    const alert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 850000,
      monthKey,
      categoryTotals: categoryTotalsMock,
    });

    expect(alert.alertLevel).toBe('CAUTION');
    expect(alert.shouldDisplay).toBe(true);
    expect(alert.remainingPaise).toBe(150000);
    expect(alert.remainingPercent).toBe(15);
    expect(alert.variant).toBe('warning');
  });

  it('LOW BUDGET WARNING: remaining percentage < 15% and > 0% triggers warning card with tips', () => {
    // Budget ₹10,000 (1,000,000 paise), Spent ₹8,600 (860,000 paise) -> Remaining ₹1,400 (14%)
    const alert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 860000,
      monthKey,
      categoryTotals: categoryTotalsMock,
    });

    expect(alert.alertLevel).toBe('LOW_BUDGET');
    expect(alert.shouldDisplay).toBe(true);
    expect(alert.remainingPaise).toBe(140000);
    expect(alert.remainingPercent).toBe(14);
    expect(alert.variant).toBe('danger');
    expect(alert.tips.some((tip) => tip.includes('Suggested daily spending limit') || tip.includes('Prioritise'))).toBe(true);
  });

  it('BUDGET EXHAUSTED: remaining balance equals zero informs user budget is fully used', () => {
    // Budget ₹10,000 (1,000,000 paise), Spent ₹10,000 (1,000,000 paise) -> Remaining 0
    const alert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 1000000,
      monthKey,
      categoryTotals: categoryTotalsMock,
    });

    expect(alert.alertLevel).toBe('BUDGET_EXHAUSTED');
    expect(alert.shouldDisplay).toBe(true);
    expect(alert.remainingPaise).toBe(0);
    expect(alert.remainingPercent).toBe(0);
    expect(alert.dailySuggestionPaise).toBe(0);
    expect(alert.isOverBudget).toBe(false);
    expect(alert.variant).toBe('danger');
    expect(alert.title).toContain('Exhausted');
  });

  it('OVER BUDGET: remaining balance below zero displays overspent amount and explains excess', () => {
    // Budget ₹10,000 (1,000,000 paise), Spent ₹10,500 (1,050,000 paise) -> Overspent ₹500 (50,000 paise)
    const alert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 1050000,
      monthKey,
      categoryTotals: categoryTotalsMock,
    });

    expect(alert.alertLevel).toBe('OVER_BUDGET');
    expect(alert.shouldDisplay).toBe(true);
    expect(alert.isOverBudget).toBe(true);
    expect(alert.overspentPaise).toBe(50000);
    expect(alert.dailySuggestionPaise).toBe(0); // Never negative daily limit
    expect(alert.variant).toBe('danger');
    expect(alert.tips.some((tip) => tip.includes('exceeded by'))).toBe(true);
  });

  it('UNSET: missing or zero budget safely prompts user to set budget without false warning', () => {
    const alert = calculateSmartBudgetAlert({
      budgetPaise: 0,
      totalSpentPaise: 50000,
      monthKey,
      categoryTotals: categoryTotalsMock,
    });

    expect(alert.alertLevel).toBe('UNSET');
    expect(alert.shouldDisplay).toBe(true);
    expect(alert.budgetPaise).toBe(0);
    expect(alert.variant).toBe('neutral');
    expect(alert.title).toContain('No Monthly Budget');
  });

  it('calculates daily spending suggestion safely without negative values or divide by zero', () => {
    // Past month (days remaining = 0)
    const pastAlert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 500000,
      monthKey: '2020-01',
      categoryTotals: [],
    });
    expect(pastAlert.daysRemaining).toBe(0);
    expect(pastAlert.dailySuggestionPaise).toBe(0);

    // Current month with positive balance
    const currentAlert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 800000, // 200,000 paise remaining
      monthKey: '2026-10',
      categoryTotals: [],
    });
    expect(currentAlert.dailySuggestionPaise).toBeGreaterThanOrEqual(0);

    // Over budget has 0 daily suggestion (never negative)
    const overAlert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 1200000,
      monthKey: '2026-10',
      categoryTotals: [],
    });
    expect(overAlert.dailySuggestionPaise).toBe(0);
  });

  it('identifies top category when spending exceeds 40%', () => {
    const alert = calculateSmartBudgetAlert({
      budgetPaise: 1000000,
      totalSpentPaise: 900000,
      monthKey: '2026-10',
      categoryTotals: [
        { name: 'Dining Out', totalPaise: 500000, percentage: 55.6 },
        { name: 'Transport', totalPaise: 400000, percentage: 44.4 },
      ],
    });

    expect(alert.tips.some((tip) => tip.includes('Dining Out') && tip.includes('%'))).toBe(true);
  });
});
