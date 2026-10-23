import express from 'express';
import cors from 'cors';
import expenseRoutes from './routes/expenseRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS Configuration
  const clientOriginEnv = process.env.CLIENT_ORIGIN || '';
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

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/$/, '');

        if (
          defaultOrigins.includes(cleanOrigin) ||
          configuredOrigins.includes(cleanOrigin) ||
          cleanOrigin.endsWith('.vercel.app') ||
          cleanOrigin.endsWith('.onrender.com') ||
          clientOriginEnv === '*'
        ) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Request parsing
  app.use(express.json({ limit: '5mb' }));

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

  // API Routes
  app.use('/api', healthRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/goals', goalRoutes);
  app.use('/api', migrationRoutes);

  // Fallback handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
