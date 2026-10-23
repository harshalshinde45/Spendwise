import { Router } from 'express';
import {
  getAllBudgets,
  getBudgetByMonth,
  setBudgetForMonth,
} from '../controllers/budgetController.js';
import { requireDatabase } from '../config/database.js';

const router = Router();

router.use(requireDatabase);

router.get('/', getAllBudgets);
router.get('/:month', getBudgetByMonth);
router.put('/:month', setBudgetForMonth);

export default router;
