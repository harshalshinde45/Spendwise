import { Router } from 'express';
import { getMonthlyAnalytics } from '../controllers/analyticsController.js';
import { requireDatabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply database connection check and authentication requirement
router.use(requireDatabase);
router.use(requireAuth);

router.get('/monthly/:month', getMonthlyAnalytics);

export default router;
