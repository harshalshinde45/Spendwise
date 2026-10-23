import { Router } from 'express';
import {
  getAllBudgets,
  getBudgetByMonth,
  setBudgetForMonth,
} from '../controllers/budgetController.js';
import { requireDatabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply database connection check and authentication requirement
router.use(requireDatabase);
router.use(requireAuth);

router.get('/', getAllBudgets);
router.get('/:month', getBudgetByMonth);
router.put('/:month', setBudgetForMonth);

export default router;
