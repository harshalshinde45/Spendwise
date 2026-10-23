import mongoose from 'mongoose';

let isConnected = false;

/**
 * Initialize MongoDB connection using Mongoose.
 * @param {string} uri - MongoDB connection string
 * @returns {Promise<boolean>} Whether connection succeeded
 */
export async function connectDatabase(uri) {
  if (!uri || uri.includes('your_mongodb_connection_string')) {
    console.warn('[SpendWise Backend] ⚠️ MONGODB_URI is not set or has placeholder value. Running with disconnected database state.');
    isConnected = false;
    return false;
  }

  try {
    mongoose.set('strictQuery', true);

    // Event listeners
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('[SpendWise Backend] ✅ MongoDB connection established.');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('[SpendWise Backend] ❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[SpendWise Backend] ⚠️ MongoDB disconnected.');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = mongoose.connection.readyState === 1;
    return isConnected;
  } catch (error) {
    isConnected = false;
    console.error('[SpendWise Backend] ❌ Failed to connect to MongoDB:', error.message);
    return false;
  }
}

/**
 * Gracefully close database connection.
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

/**
 * Check if database is currently connected and operational.
 * @returns {boolean}
 */
export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Express middleware to ensure database is connected before executing stateful operations.
 * Returns 503 Service Unavailable if database is unreachable.
 */
export function requireDatabase(req, res, next) {
  if (!isDbConnected()) {
    return res.status(503).json({
      error: 'Database Unavailable',
      message: 'The operation cannot be completed because the MongoDB database is not connected. Please configure MONGODB_URI in backend/.env.',
    });
  }
  next();
}
