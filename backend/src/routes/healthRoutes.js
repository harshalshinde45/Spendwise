import { Router } from 'express';
import { isDbConnected } from '../config/database.js';

const router = Router();

router.get('/health', (req, res) => {
  const connected = isDbConnected();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SpendWise API',
    database: {
      status: connected ? 'connected' : 'disconnected',
      isOperational: connected,
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;
