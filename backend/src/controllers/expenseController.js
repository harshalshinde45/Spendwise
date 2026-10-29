import { Expense } from '../models/Expense.js';
import {
  validateExpenseInput,
  isValidObjectId,
  isValidMonthKey,
  ALLOWED_CATEGORIES,
} from '../utils/validation.js';

/**
 * GET /api/expenses
 * Retrieve expenses owned by the authenticated user, with optional filtering, sorting, and pagination.
 */
export async function getExpenses(req, res, next) {
  try {
    const { month, category, sort, limit, page } = req.query;
    const filter = { userId: req.user.id };

    // Efficient B-Tree date range filter
    if (month) {
      if (!isValidMonthKey(month)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid month format. Expected YYYY-MM.',
        });
      }
      filter.date = { $gte: `${month}-01`, $lte: `${month}-31` };
    }

    // Strict category validation & sanitization
    if (category) {
      const cleanCat = String(category).trim();
      if (ALLOWED_CATEGORIES.includes(cleanCat)) {
        filter.category = cleanCat;
      }
    }

    let sortOptions = { date: -1, createdAt: -1 };
    if (sort === 'date-asc') {
      sortOptions = { date: 1, createdAt: 1 };
    } else if (sort === 'amount-desc') {
      sortOptions = { amountPaise: -1, date: -1 };
    } else if (sort === 'amount-asc') {
      sortOptions = { amountPaise: 1, date: -1 };
    }

    let query = Expense.find(filter).sort(sortOptions);

    // Optional safe pagination
    if (limit) {
      const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 500);
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      query = query.skip((parsedPage - 1) * parsedLimit).limit(parsedLimit);
    }

    const expenses = await query;
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
