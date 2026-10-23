import mongoose from 'mongoose';

let isConnected = false;

/**
 * Ensures obsolete indexes (such as pre-multi-user unique indexes) are safely cleaned up
 * and multi-tenant compound indexes are established.
 */
async function syncDatabaseIndexes() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // 1. Inspect monthlybudgets collection
    const budgetCollections = await db.listCollections({ name: 'monthlybudgets' }).toArray();
    if (budgetCollections.length > 0) {
      const budgetIndexes = await db.collection('monthlybudgets').indexes();

      // Check if obsolete single-field unique index 'month_1' exists
      const obsoleteMonthIdx = budgetIndexes.find(
        (idx) => idx.name === 'month_1' || (idx.key && idx.key.month === 1 && !idx.key.userId && idx.unique)
      );

      if (obsoleteMonthIdx) {
        console.log(`[SpendWise Database] 🛠️ Dropping obsolete single-tenant index '${obsoleteMonthIdx.name}' on monthlybudgets...`);
        await db.collection('monthlybudgets').dropIndex(obsoleteMonthIdx.name).catch((e) => {
          console.warn('[SpendWise Database] Notice dropping obsolete index:', e.message);
        });
        console.log(`[SpendWise Database] ✅ Obsolete index '${obsoleteMonthIdx.name}' dropped successfully.`);
      }

      // Ensure compound multi-tenant index exists
      const hasCompoundIndex = budgetIndexes.some(
        (idx) => idx.key && idx.key.userId === 1 && idx.key.month === 1 && idx.unique
      );
      if (!hasCompoundIndex) {
        console.log('[SpendWise Database] 🔨 Creating multi-tenant compound index { userId: 1, month: 1 }...');
        await db.collection('monthlybudgets').createIndex({ userId: 1, month: 1 }, { unique: true });
      }

      // Check for orphaned legacy records without userId and assign them if a primary user exists
      const orphanCount = await db.collection('monthlybudgets').countDocuments({ userId: { $in: [null, undefined] } });
      if (orphanCount > 0) {
        const firstUser = await db.collection('users').findOne({});
        if (firstUser) {
          console.log(`[SpendWise Database] 🔄 Migrating ${orphanCount} legacy budgets to user ${firstUser.email}...`);
          await db.collection('monthlybudgets').updateMany(
            { userId: { $in: [null, undefined] } },
            { $set: { userId: firstUser._id } }
          );
        }
      }
    }

    // 2. Inspect expenses collection for legacy unassigned expenses
    const expCollections = await db.listCollections({ name: 'expenses' }).toArray();
    if (expCollections.length > 0) {
      const orphanExpenses = await db.collection('expenses').countDocuments({ userId: { $in: [null, undefined] } });
      if (orphanExpenses > 0) {
        const firstUser = await db.collection('users').findOne({});
        if (firstUser) {
          console.log(`[SpendWise Database] 🔄 Migrating ${orphanExpenses} legacy expenses to user ${firstUser.email}...`);
          await db.collection('expenses').updateMany(
            { userId: { $in: [null, undefined] } },
            { $set: { userId: firstUser._id } }
          );
        }
      }
    }
  } catch (syncErr) {
    console.warn('[SpendWise Database] ⚠️ Index synchronization note:', syncErr.message);
  }
}

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

    // Run self-healing index sync and migrations
    if (isConnected) {
      await syncDatabaseIndexes();
    }

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
