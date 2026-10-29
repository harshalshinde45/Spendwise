import rateLimit from 'express-rate-limit';

const isTestEnv = process.env.NODE_ENV === 'test';

/**
 * User-specific rate limiter for AI operations.
 * Enforces request limits per authenticated user (using req.user.id),
 * with fallback to client IP if unauthenticated.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute rolling window
  max: 30, // 30 AI requests per 15 minutes per user
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  skip: () => isTestEnv,
  keyGenerator: (req) => {
    // Strictly isolate by authenticated user ID
    if (req.user?.id) {
      return `ai_user_${req.user.id}`;
    }
    return `ai_ip_${req.ip || 'unknown'}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message:
        'You have reached your AI assistant request limit for this 15-minute period. Please wait a few moments before trying again.',
    });
  },
});
