import { Router } from 'express';
import { requireDatabase } from '../config/database.js';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
} from '../controllers/goalController.js';

const router = Router();

// Apply database connectivity check to all goal operations
router.use(requireDatabase);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/contribute', contributeToGoal);

export default router;
