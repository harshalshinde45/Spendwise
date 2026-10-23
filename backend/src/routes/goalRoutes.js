import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
} from '../controllers/goalController.js';
import { requireDatabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply database connection check and authentication requirement
router.use(requireDatabase);
router.use(requireAuth);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/contribute', contributeToGoal);

export default router;
