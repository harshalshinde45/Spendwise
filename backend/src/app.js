import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Trust reverse proxy (e.g. Render, Vercel) for accurate client IP identification in rate limiters
  app.set('trust proxy', 1);

  // 1. HTTP Security Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // REST API serving pure JSON
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hidePoweredBy: true,
      noSniff: true,
      xssFilter: true,
      hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    })
  );

  // 2. Strict CORS Configuration
  const clientOriginEnv = env.CLIENT_ORIGIN || '';
  const configuredOrigins = clientOriginEnv
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'https://spendwise-nu-gilt.vercel.app',
  ];

  const allowedOriginsSet = new Set([...defaultOrigins, ...configuredOrigins]);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-to-server, curl, Postman, native mobile)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/$/, '');

        if (clientOriginEnv === '*' || allowedOriginsSet.has(cleanOrigin)) {
          return callback(null, true);
        }

        // Reject unapproved origins cleanly
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24-hour preflight cache
    })
  );

  // 3. Request Timeout Protection (15 seconds)
  app.use((req, res, next) => {
    req.setTimeout(15000, () => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: 'The request took too long to complete. Please try again.',
        });
      }
    });
    next();
  });

  // 4. Rate Limiting Protection (bypassed in test environment)
  const isTestEnv = process.env.NODE_ENV === 'test';

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnv,
    message: {
      error: 'Too Many Requests',
      message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
    },
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 600, // 600 requests per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnv,
    message: {
      error: 'Too Many Requests',
      message: 'Request rate limit exceeded. Please slow down and try again later.',
    },
  });

  // 5. Global Request Body Limit (Strict 50kb for standard JSON endpoints to prevent DoS)
  app.use(express.json({ limit: '50kb' }));

  // Root Welcome Endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'SpendWise Backend API',
      message: 'SpendWise REST API is running smoothly. Use /api/health for system status.',
      health: '/api/health',
      version: '1.0.0',
    });
  });

  // 6. API Routes with Targeted Rate Limiting
  app.use('/api', healthRoutes);
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/expenses', apiLimiter, expenseRoutes);
  app.use('/api/budgets', apiLimiter, budgetRoutes);
  app.use('/api/analytics', apiLimiter, analyticsRoutes);
  app.use('/api/goals', apiLimiter, goalRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api', apiLimiter, migrationRoutes);

  // Fallback handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
