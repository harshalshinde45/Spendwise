import { Router } from 'express';
import { getAIStatus, pingAI, parseExpense } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/aiLimiter.js';

const router = Router();

// 1. Enforce authentication on all AI endpoints (attaches req.user)
router.use(requireAuth);

// 2. Apply user-specific rate limiting
router.use(aiRateLimiter);

// Status check (readiness check)
router.get('/status', getAIStatus);

// Connectivity / generation ping
router.post('/ping', pingAI);

// Natural-language expense parser (Zero-write draft generator)
router.post('/parse-expense', parseExpense);

export default router;
