import { Router } from 'express';
import {
  migrateLocalStorageData,
  clearAllDatabaseData,
} from '../controllers/migrationController.js';
import { requireDatabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply database connection check and authentication requirement
router.use(requireDatabase);
router.use(requireAuth);

router.post('/migrate', migrateLocalStorageData);
router.delete('/data', clearAllDatabaseData);

export default router;
