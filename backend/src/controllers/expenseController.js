import { Expense } from '../models/Expense.js';
import { validateExpenseInput, isValidObjectId, isValidMonthKey } from '../utils/validation.js';

/**
 * GET /api/expenses
 * Retrieve expenses, with optional filtering by month and category, plus sorting.
 */
export async function getExpenses(req, res, next) {
  try {
    const { month, category, sort } = req.query;
    const filter = {};

    if (month) {
      if (!isValidMonthKey(month)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid month format. Expected YYYY-MM.',
        });
      }
      filter.date = { $regex: `^${month}` };
    }

    if (category) {
      filter.category = category;
    }

    let sortOptions = { date: -1, createdAt: -1 };
    if (sort === 'date-asc') {
      sortOptions = { date: 1, createdAt: 1 };
    } else if (sort === 'amount-desc') {
      sortOptions = { amountPaise: -1, date: -1 };
    } else if (sort === 'amount-asc') {
      sortOptions = { amountPaise: 1, date: -1 };
    }

    const expenses = await Expense.find(filter).sort(sortOptions);
    res.status(200).json(expenses);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/expenses/:id
 * Retrieve a single expense by ID.
 */
export async function getExpenseById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'The requested expense ID is not a valid MongoDB ObjectId.',
      });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Expense with ID ${id} was not found.`,
      });
    }

    res.status(200).json(expense);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/expenses
 * Create a new expense after validating inputs.
 */
export async function createExpense(req, res, next) {
  try {
    const validation = validateExpenseInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
    }

    const newExpense = new Expense(validation.sanitized);
    const saved = await newExpense.save();

    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/expenses/:id
 * Update an existing expense.
 */
export async function updateExpense(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'The requested expense ID is not a valid MongoDB ObjectId.',
      });
    }

    const validation = validateExpenseInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.errors,
      });
    }

    const updated = await Expense.findByIdAndUpdate(id, validation.sanitized, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Expense with ID ${id} was not found.`,
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/expenses/:id
 * Delete an existing expense.
 */
export async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'The requested expense ID is not a valid MongoDB ObjectId.',
      });
    }

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Expense with ID ${id} was not found.`,
      });
    }

    res.status(200).json({
      message: 'Expense deleted successfully.',
      id,
    });
  } catch (error) {
    next(error);
  }
}
