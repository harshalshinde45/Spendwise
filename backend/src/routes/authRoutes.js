import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDatabase } from '../config/database.js';

const router = Router();

// Apply requireDatabase to ensure MongoDB connection is operational
router.use(requireDatabase);

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

export default router;
