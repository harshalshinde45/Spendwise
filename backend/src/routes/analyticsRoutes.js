import { Router } from 'express';
import { getMonthlyAnalytics } from '../controllers/analyticsController.js';
import { requireDatabase } from '../config/database.js';

const router = Router();

router.use(requireDatabase);

router.get('/monthly/:month', getMonthlyAnalytics);

export default router;
