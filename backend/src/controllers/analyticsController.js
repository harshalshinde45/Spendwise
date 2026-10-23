import { Expense } from '../models/Expense.js';
import { MonthlyBudget } from '../models/MonthlyBudget.js';
import { isValidMonthKey } from '../utils/validation.js';

/**
 * GET /api/analytics/monthly/:month
 * Returns monthly analytics calculated from real database records.
 */
export async function getMonthlyAnalytics(req, res, next) {
  try {
    const { month } = req.params;

    if (!isValidMonthKey(month)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid month format. Expected YYYY-MM (e.g. 2026-10).',
      });
    }

    // 1. Fetch all expenses for the target month
    const expenses = await Expense.find({ date: { $regex: `^${month}` } });
    const transactionCount = expenses.length;
    const totalSpentPaise = expenses.reduce((sum, exp) => sum + exp.amountPaise, 0);

    // 2. Fetch budget for the target month
    const budgetDoc = await MonthlyBudget.findOne({ month });
    const budgetPaise = budgetDoc ? budgetDoc.amountPaise : 0;
    const isBudgetSet = budgetPaise > 0;

    // 3. Compute Category breakdown
    const categoryMap = new Map();
    for (const exp of expenses) {
      const cat = exp.category || 'Other';
      const existing = categoryMap.get(cat) || { totalPaise: 0, count: 0 };
      categoryMap.set(cat, {
        totalPaise: existing.totalPaise + exp.amountPaise,
        count: existing.count + 1,
      });
    }

    const categoryBreakdown = [];
    for (const [name, data] of categoryMap.entries()) {
      const percentage = totalSpentPaise > 0 ? Number(((data.totalPaise / totalSpentPaise) * 100).toFixed(1)) : 0;
      categoryBreakdown.push({
        name,
        totalPaise: data.totalPaise,
        count: data.count,
        percentage,
      });
    }
    // Sort descending by total spend
    categoryBreakdown.sort((a, b) => b.totalPaise - a.totalPaise);

    // 4. Compute budget utilization & status
    let remainingPaise = 0;
    let remainingPercent = 0;
    let utilizationPercent = 0;
    let visualProgressPercent = 0;
    let isOverBudget = false;
    let overspentPaise = 0;
    let statusLevel = 'unset';
    let alertLevel = 'UNSET';

    if (isBudgetSet) {
      remainingPaise = budgetPaise - totalSpentPaise;
      const rawRemainingPercent = (remainingPaise / budgetPaise) * 100;
      remainingPercent = Number(rawRemainingPercent.toFixed(1));

      const rawUtilization = (totalSpentPaise / budgetPaise) * 100;
      utilizationPercent = Number(rawUtilization.toFixed(1));
      isOverBudget = remainingPaise < 0;
      overspentPaise = isOverBudget ? Math.abs(remainingPaise) : 0;
      visualProgressPercent = Number(Math.min(100, Math.max(0, rawUtilization)).toFixed(1));

      if (remainingPaise < 0) {
        alertLevel = 'OVER_BUDGET';
        statusLevel = 'danger';
      } else if (remainingPaise === 0) {
        alertLevel = 'BUDGET_EXHAUSTED';
        statusLevel = 'danger';
      } else if (rawRemainingPercent < 15) {
        alertLevel = 'LOW_BUDGET';
        statusLevel = 'danger';
      } else if (rawRemainingPercent <= 30) {
        alertLevel = 'CAUTION';
        statusLevel = 'warning';
      } else {
        alertLevel = 'HEALTHY';
        statusLevel = 'healthy';
      }
    }

    const averageExpensePaise = transactionCount > 0 ? Math.round(totalSpentPaise / transactionCount) : 0;

    res.status(200).json({
      month,
      totalSpentPaise,
      transactionCount,
      averageExpensePaise,
      budget: {
        isSet: isBudgetSet,
        budgetPaise,
        remainingPaise,
        remainingPercent,
        utilizationPercent,
        visualProgressPercent,
        isOverBudget,
        overspentPaise,
        statusLevel,
        alertLevel,
      },
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
}
