import { Goal } from '../models/Goal.js';
import { isValidObjectId } from '../utils/validation.js';

/**
 * GET /api/goals
 * Retrieve all savings goals for the authenticated user.
 */
export async function getGoals(req, res, next) {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(goals);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/goals
 * Create a new savings goal for the authenticated user.
 */
export async function createGoal(req, res, next) {
  try {
    const { name, targetPaise, savedPaise, targetDate, personalMessage, category, color } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Goal name is required.',
      });
    }

    const parsedTarget = Number(targetPaise);
    if (!Number.isInteger(parsedTarget) || parsedTarget < 100) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Target amount must be a positive integer in paise (at least ₹1).',
      });
    }

    const newGoal = await Goal.create({
      userId: req.user.id,
      name: name.trim(),
      targetPaise: parsedTarget,
      savedPaise: Number.isInteger(Number(savedPaise)) ? Math.max(0, Number(savedPaise)) : 0,
      targetDate: typeof targetDate === 'string' ? targetDate.trim() : '',
      personalMessage: typeof personalMessage === 'string' ? personalMessage.trim() : '',
      category: typeof category === 'string' && category.trim() ? category.trim() : 'General',
      color: typeof color === 'string' && color.trim() ? color.trim() : '#3E6B50',
    });

    res.status(201).json(newGoal);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/goals/:id
 * Update goal details or savings amount for the authenticated user.
 */
export async function updateGoal(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid goal ID format.',
      });
    }

    const { name, targetPaise, savedPaise, targetDate, personalMessage, category, color } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Goal name cannot be empty.' });
      }
      updates.name = name.trim();
    }

    if (targetPaise !== undefined) {
      const parsed = Number(targetPaise);
      if (!Number.isInteger(parsed) || parsed < 100) {
        return res.status(400).json({ error: 'Validation Error', message: 'Target amount must be at least ₹1 in paise.' });
      }
      updates.targetPaise = parsed;
    }

    if (savedPaise !== undefined) {
      const parsed = Number(savedPaise);
      if (!Number.isInteger(parsed) || parsed < 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Saved amount cannot be negative.' });
      }
      updates.savedPaise = parsed;
    }

    if (targetDate !== undefined) updates.targetDate = String(targetDate).trim();
    if (personalMessage !== undefined) updates.personalMessage = String(personalMessage).trim();
    if (category !== undefined) updates.category = String(category).trim();
    if (color !== undefined) updates.color = String(color).trim();

    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedGoal) {
      return res.status(404).json({ error: 'Not Found', message: 'Savings goal not found or belongs to another user.' });
    }

    res.status(200).json(updatedGoal);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/goals/:id
 * Remove a savings goal owned by the authenticated user.
 */
export async function deleteGoal(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid goal ID format.',
      });
    }

    const deleted = await Goal.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Savings goal not found or belongs to another user.' });
    }

    res.status(200).json({ message: 'Savings goal deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/goals/:id/contribute
 * Add savings towards a goal owned by the authenticated user.
 */
export async function contributeToGoal(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Invalid goal ID format.' });
    }

    const { amountPaise } = req.body;
    const parsedAmount = Number(amountPaise);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'Contribution amount must be a positive integer in paise.' });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ error: 'Not Found', message: 'Savings goal not found or belongs to another user.' });
    }

    goal.savedPaise += parsedAmount;
    await goal.save();

    res.status(200).json(goal);
  } catch (error) {
    next(error);
  }
}
