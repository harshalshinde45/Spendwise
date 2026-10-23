import { MonthlyBudget } from '../models/MonthlyBudget.js';
import { validateBudgetInput, isValidMonthKey } from '../utils/validation.js';

/**
 * GET /api/budgets
 * Retrieve all configured budgets for the authenticated user as { "YYYY-MM": amountPaise }.
 */
export async function getAllBudgets(req, res, next) {
  try {
    const budgets = await MonthlyBudget.find({ userId: req.user.id }).sort({ month: -1 });
    const budgetMap = {};
    for (const b of budgets) {
      budgetMap[b.month] = b.amountPaise;
    }
    res.status(200).json(budgetMap);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/budgets/:month
 * Retrieve budget for a particular month for the authenticated user.
 */
export async function getBudgetByMonth(req, res, next) {
  try {
    const { month } = req.params;

    if (!isValidMonthKey(month)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid month format. Expected YYYY-MM (e.g. 2026-10).',
      });
    }

    const budget = await MonthlyBudget.findOne({ userId: req.user.id, month });
    if (!budget) {
      return res.status(200).json({
        month,
        amountPaise: 0,
        isSet: false,
      });
    }

    res.status(200).json({
      month: budget.month,
      amountPaise: budget.amountPaise,
      isSet: budget.amountPaise > 0,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/budgets/:month
 * Create or update the budget for that month for the authenticated user.
 */
export async function setBudgetForMonth(req, res, next) {
  try {
    const { month } = req.params;
    const validation = validateBudgetInput(month, req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
    }

    const { amountPaise } = validation.sanitized;

    // If budget is set to 0, remove the document for this user
    if (amountPaise === 0) {
      await MonthlyBudget.findOneAndDelete({ userId: req.user.id, month });
      return res.status(200).json({
        month,
        amountPaise: 0,
        isSet: false,
        message: 'Budget cleared successfully.',
      });
    }

    const budget = await MonthlyBudget.findOneAndUpdate(
      { userId: req.user.id, month },
      { userId: req.user.id, month, amountPaise, updatedAt: new Date() },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      month: budget.month,
      amountPaise: budget.amountPaise,
      isSet: true,
      message: 'Budget saved successfully.',
    });
  } catch (error) {
    next(error);
  }
}
