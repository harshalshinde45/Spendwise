import { Expense } from '../models/Expense.js';
import { MonthlyBudget } from '../models/MonthlyBudget.js';
import { validateExpenseInput, isValidMonthKey } from '../utils/validation.js';

/**
 * POST /api/migrate
 * Safely imports an array of expenses and a map of budgets from client Local Storage.
 * Prevents duplicates by checking existing records matching (date, amountPaise, category, description).
 */
export async function migrateLocalStorageData(req, res, next) {
  try {
    const { expenses = [], budgets = {} } = req.body;

    if (!Array.isArray(expenses) || typeof budgets !== 'object' || budgets === null) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid payload format. Expected { expenses: Array, budgets: Object }',
      });
    }

    let importedExpensesCount = 0;
    let skippedExpensesCount = 0;
    let importedBudgetsCount = 0;

    // 1. Process Expenses
    for (const exp of expenses) {
      const validation = validateExpenseInput(exp);
      if (!validation.isValid) {
        skippedExpensesCount++;
        continue;
      }

      const { amountPaise, category, date, description } = validation.sanitized;

      // Duplicate prevention: check if identical record already exists
      const existing = await Expense.findOne({
        amountPaise,
        category,
        date,
        description,
      });

      if (existing) {
        skippedExpensesCount++;
      } else {
        await Expense.create({
          amountPaise,
          category,
          date,
          description,
        });
        importedExpensesCount++;
      }
    }

    // 2. Process Budgets
    for (const [monthKey, amount] of Object.entries(budgets)) {
      if (!isValidMonthKey(monthKey) || typeof amount !== 'number' || amount < 0 || !Number.isInteger(amount)) {
        continue;
      }

      if (amount > 0) {
        await MonthlyBudget.findOneAndUpdate(
          { month: monthKey },
          { month: monthKey, amountPaise: amount, updatedAt: new Date() },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        importedBudgetsCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Migration completed successfully.',
      summary: {
        expensesImported: importedExpensesCount,
        expensesSkipped: skippedExpensesCount,
        budgetsConfigured: importedBudgetsCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/data
 * Clears all expense and budget records from the database.
 */
export async function clearAllDatabaseData(req, res, next) {
  try {
    const expResult = await Expense.deleteMany({});
    const bgtResult = await MonthlyBudget.deleteMany({});

    res.status(200).json({
      success: true,
      message: 'All expense and monthly budget records have been permanently cleared from the database.',
      deletedExpensesCount: expResult.deletedCount,
      deletedBudgetsCount: bgtResult.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}
