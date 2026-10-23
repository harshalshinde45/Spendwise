import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

// Resolve directory of server.js to reliably load backend/.env regardless of process.cwd()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../.env');

// Ensure environment variables are loaded before reading PORT or starting server
dotenv.config({ path: backendEnvPath });
// Also load from current working directory as fallback
dotenv.config();

const PORT = parseInt(process.env.PORT, 10) || 5001;
const MONGODB_URI = process.env.MONGODB_URI || '';

const app = createApp();

const server = app.listen(PORT, async () => {
  console.log(`[SpendWise Backend] 🚀 Server running on port ${PORT} (http://localhost:${PORT})`);
  console.log(`[SpendWise Backend] 🌐 Health endpoint: http://localhost:${PORT}/api/health`);

  // Attempt database connection
  await connectDatabase(MONGODB_URI);
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log('\n[SpendWise Backend] Shutting down gracefully...');
  server.close(async () => {
    await disconnectDatabase();
    console.log('[SpendWise Backend] Closed remaining connections. Exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
