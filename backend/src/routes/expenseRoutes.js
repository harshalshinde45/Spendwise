import { Router } from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { requireDatabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply database connection check and authentication requirement
router.use(requireDatabase);
router.use(requireAuth);

router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
