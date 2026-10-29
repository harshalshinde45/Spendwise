import { env, getSanitizedMongoUri } from './config/env.js';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  console.log(`[SpendWise Backend] 🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT} (http://localhost:${env.PORT})`);
  console.log(`[SpendWise Backend] 🌐 Health endpoint: http://localhost:${env.PORT}/api/health`);
  console.log(`[SpendWise Backend] 🗄️ Database target: ${getSanitizedMongoUri(env.MONGODB_URI)}`);

  // Attempt database connection
  await connectDatabase(env.MONGODB_URI);
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
