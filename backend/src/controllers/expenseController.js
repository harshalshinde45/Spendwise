import { Expense } from '../models/Expense.js';
import { validateExpenseInput, isValidObjectId, isValidMonthKey } from '../utils/validation.js';

/**
 * GET /api/expenses
 * Retrieve expenses owned by the authenticated user, with optional filtering and sorting.
 */
export async function getExpenses(req, res, next) {
  try {
    const { month, category, sort } = req.query;
    const filter = { userId: req.user.id };

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
 * Retrieve a single expense by ID, restricted to the authenticated user.
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

    const expense = await Expense.findOne({ _id: id, userId: req.user.id });
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
 * Create a new expense belonging strictly to the authenticated user.
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

    const newExpense = new Expense({
      ...validation.sanitized,
      userId: req.user.id,
    });
    const saved = await newExpense.save();

    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/expenses/:id
 * Update an existing expense owned by the authenticated user.
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

    const updated = await Expense.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      validation.sanitized,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Expense with ID ${id} was not found or belongs to another user.`,
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/expenses/:id
 * Delete an existing expense owned by the authenticated user.
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

    const deleted = await Expense.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Expense with ID ${id} was not found or belongs to another user.`,
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
