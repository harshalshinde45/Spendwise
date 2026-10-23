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
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Request parsing
  app.use(express.json({ limit: '5mb' }));

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
