import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { MonthlyBudget } from '../models/MonthlyBudget.js';
import { isValidMonthKey } from '../utils/validation.js';

/**
 * GET /api/analytics/monthly/:month
 * Returns monthly analytics calculated via high-performance MongoDB aggregation pipeline.
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

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    // 1. High-Performance MongoDB Aggregation Pipeline
    const [aggResult, budgetDoc] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            userId: userObjectId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalSpentPaise: { $sum: '$amountPaise' },
                  count: { $sum: 1 },
                },
              },
            ],
            categories: [
              {
                $group: {
                  _id: '$category',
                  totalPaise: { $sum: '$amountPaise' },
                  count: { $sum: 1 },
                },
              },
              { $sort: { totalPaise: -1 } },
            ],
          },
        },
      ]),
      MonthlyBudget.findOne({ userId: req.user.id, month }),
    ]);

    const totalsData = aggResult[0]?.totals[0] || { totalSpentPaise: 0, count: 0 };
    const rawCategories = aggResult[0]?.categories || [];

    const totalSpentPaise = totalsData.totalSpentPaise;
    const transactionCount = totalsData.count;

    // 2. Budget information for target month
    const budgetPaise = budgetDoc ? budgetDoc.amountPaise : 0;
    const isBudgetSet = budgetPaise > 0;

    // 3. Category Breakdown calculation
    const categoryBreakdown = rawCategories.map((cat) => {
      const percentage =
        totalSpentPaise > 0
          ? Number(((cat.totalPaise / totalSpentPaise) * 100).toFixed(1))
          : 0;
      return {
        name: cat._id || 'Other',
        totalPaise: cat.totalPaise,
        count: cat.count,
        percentage,
      };
    });

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
        budgetPaise,
        isSet: isBudgetSet,
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
