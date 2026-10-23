import { describe, it, expect } from 'vitest';
import {
  calculateFinancialWeather,
  calculateSpendingSpeedometer,
  calculateExpenseDetective,
  simulateFinancialPurchase,
  calculateSurvivalBudget,
} from '../utils/intelligence';

describe('Financial Weather Engine', () => {
  const monthKey = '2026-10';

  it('reports UNSET when no budget is configured', () => {
    const weather = calculateFinancialWeather({ budgetPaise: 0, totalSpentPaise: 50000, monthKey });
    expect(weather.state).toBe('UNSET');
    expect(weather.badgeVariant).toBe('neutral');
  });

  it('reports STORM when remaining budget is negative', () => {
    const weather = calculateFinancialWeather({
      budgetPaise: 1000000, // ₹10,000
      totalSpentPaise: 1050000, // ₹10,500
      monthKey,
    });
    expect(weather.state).toBe('STORM');
    expect(weather.headline).toContain('Storm');
    expect(weather.badgeVariant).toBe('storm');
  });

  it('reports BUDGET_EXHAUSTED when budget exactly equals spent', () => {
    const weather = calculateFinancialWeather({
      budgetPaise: 1000000,
      totalSpentPaise: 1000000,
      monthKey,
    });
    expect(weather.state).toBe('BUDGET_EXHAUSTED');
  });

  it('reports RAINY when less than 15% remaining', () => {
    const weather = calculateFinancialWeather({
      budgetPaise: 1000000,
      totalSpentPaise: 880000, // 12% remaining
      monthKey,
    });
    expect(weather.state).toBe('RAINY');
    expect(weather.badgeVariant).toBe('rainy');
  });

  it('reports CLOUDY when spending pace is notably faster than calendar days elapsed', () => {
    // Test on day 5 of month (16% of month elapsed), but spent 45% of budget
    const weather = calculateFinancialWeather({
      budgetPaise: 1000000,
      totalSpentPaise: 450000,
      monthKey: '2026-10',
      currentDateStr: '2026-10-05',
    });
    expect(weather.state).toBe('CLOUDY');
  });

  it('reports SUNNY when budget has healthy reserve and sustainable pace', () => {
    // Test on day 10 of month, spent 20% of budget (80% remaining)
    const weather = calculateFinancialWeather({
      budgetPaise: 1000000,
      totalSpentPaise: 200000,
      monthKey: '2026-10',
      currentDateStr: '2026-10-10',
    });
    expect(weather.state).toBe('SUNNY');
    expect(weather.badgeVariant).toBe('sunny');
  });
});

describe('Spending Speedometer Engine', () => {
  it('calculates pace ratio and burn rate accurately', () => {
    // Day 10 of 30, spent ₹6,000 of ₹10,000 (60% spent in ~33% of month)
    const speed = calculateSpendingSpeedometer({
      budgetPaise: 1000000,
      totalSpentPaise: 600000,
      monthKey: '2026-11', // November has 30 days
      currentDateStr: '2026-11-10',
    });

    expect(speed.isConfigured).toBe(true);
    expect(speed.budgetSpentPercent).toBe(60);
    expect(speed.monthElapsedPercent).toBeCloseTo(33.3, 0);
    expect(speed.paceRatio).toBeGreaterThan(1.5);
    expect(speed.speedLevel).toBe('REDLINE');
    expect(speed.exhaustionDayEstimate).toBeLessThanOrEqual(30);
    expect(speed.insightSummary).toContain('60%');
  });

  it('handles zero budget safely', () => {
    const speed = calculateSpendingSpeedometer({
      budgetPaise: 0,
      totalSpentPaise: 50000,
      monthKey: '2026-10',
    });
    expect(speed.isConfigured).toBe(false);
    expect(speed.speedLevel).toBe('UNSET');
  });
});

describe('Expense Detective Engine', () => {
  const sampleExpenses = [
    { id: '1', amountPaise: 5000, category: 'Food', date: '2026-10-01' },
    { id: '2', amountPaise: 8000, category: 'Food', date: '2026-10-02' },
    { id: '3', amountPaise: 12000, category: 'Transport', date: '2026-10-03' },
    { id: '4', amountPaise: 15000, category: 'Food', date: '2026-10-04' },
    { id: '5', amountPaise: 180000, category: 'Electronics', date: '2026-10-05', description: 'Monitor' }, // Outlier
    { id: '6', amountPaise: 7000, category: 'Food', date: '2026-10-06' },
    { id: '7', amountPaise: 9000, category: 'Food', date: '2026-10-07' },
  ];

  it('discovers micro-transactions and outlier transactions from real data', () => {
    const insights = calculateExpenseDetective({
      expenses: sampleExpenses,
      selectedMonth: '2026-10',
      categoryTotals: [{ name: 'Food', totalPaise: 46000, count: 5, percentage: 70 }],
    });

    expect(insights.length).toBeGreaterThan(0);
    const hasOutlier = insights.some((i) => i.type === 'outlier');
    expect(hasOutlier).toBe(true);
  });
});

describe('Financial Time Machine Simulator', () => {
  it('accurately projects purchase impact without modifying state', () => {
    // Budget ₹10,000, spent ₹5,000, proposing ₹2,500 purchase
    const sim = simulateFinancialPurchase({
      budgetPaise: 1000000,
      totalSpentPaise: 500000,
      monthKey: '2026-10',
      purchaseAmountPaise: 250000,
      category: 'Electronics',
    });

    expect(sim.currentRemainingPaise).toBe(500000);
    expect(sim.simulatedRemainingPaise).toBe(250000);
    expect(sim.isExceeded).toBe(false);
    expect(sim.scenarios.now.remainingPaise).toBe(250000);
    expect(sim.scenarios.postpone.remainingPaise).toBe(500000);
    expect(sim.scenarios.cheaperAlternative.remainingPaise).toBeGreaterThan(250000);
  });

  it('flags over-budget purchases properly', () => {
    // Budget ₹10,000, spent ₹8,000, proposing ₹3,000 purchase -> shortfall ₹1,000
    const sim = simulateFinancialPurchase({
      budgetPaise: 1000000,
      totalSpentPaise: 800000,
      monthKey: '2026-10',
      purchaseAmountPaise: 300000,
    });

    expect(sim.isExceeded).toBe(true);
    expect(sim.shortfallPaise).toBe(100000);
  });
});

describe('Survival Budget Mode Engine', () => {
  it('calculates discretionary allowance after reserving planned essentials', () => {
    // Remaining budget: ₹6,000 (600,000 paise), 10 days remaining
    // Planned essentials: Food ₹2,000, Travel ₹1,000 -> Total ₹3,000 (300,000 paise)
    // Available discretionary: ₹3,000 -> ₹300/day
    const survival = calculateSurvivalBudget({
      remainingBudgetPaise: 600000,
      daysRemaining: 10,
      plannedEssentials: {
        food: 200000,
        travel: 100000,
      },
    });

    expect(survival.totalPlannedEssentialsPaise).toBe(300000);
    expect(survival.availableDiscretionaryPaise).toBe(300000);
    expect(survival.dailyDiscretionaryPaise).toBe(30000);
    expect(survival.hasShortfall).toBe(false);
  });

  it('detects shortfalls when planned essentials exceed remaining budget', () => {
    const survival = calculateSurvivalBudget({
      remainingBudgetPaise: 200000, // ₹2,000
      daysRemaining: 5,
      plannedEssentials: {
        rent: 300000, // ₹3,000
      },
    });

    expect(survival.hasShortfall).toBe(true);
    expect(survival.shortfallPaise).toBe(100000);
    expect(survival.dailyDiscretionaryPaise).toBe(0);
  });
});
