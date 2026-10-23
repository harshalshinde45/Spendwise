import { Router } from 'express';
import {
  migrateLocalStorageData,
  clearAllDatabaseData,
} from '../controllers/migrationController.js';
import { requireDatabase } from '../config/database.js';

const router = Router();

router.use(requireDatabase);

router.post('/migrate', migrateLocalStorageData);
router.delete('/data', clearAllDatabaseData);

export default router;
