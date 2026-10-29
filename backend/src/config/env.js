import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Determine backend directory reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../../.env');

// Load environment variables immediately before any other module imports
dotenv.config({ path: backendEnvPath });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Insecure development fallback key
const INSECURE_DEV_JWT_SECRET = 'spendwise_jwt_secret_dev_2026_secure';

let jwtSecret = process.env.JWT_SECRET?.trim() || '';

if (!jwtSecret) {
  if (isProduction) {
    console.error('[SpendWise FATAL ERROR]: JWT_SECRET is not configured in production environment.');
    console.error('Halting server startup to prevent unauthorized token forgery. Please set JWT_SECRET in environment variables.');
    process.exit(1);
  } else {
    console.warn('[SpendWise Security Notice]: JWT_SECRET is not set. Using temporary local development key. Do NOT use in production.');
    jwtSecret = INSECURE_DEV_JWT_SECRET;
  }
} else if (isProduction && jwtSecret === INSECURE_DEV_JWT_SECRET) {
  console.error('[SpendWise FATAL ERROR]: Production environment is configured with the insecure default JWT_SECRET.');
  console.error('Please configure a strong, unique secret key for JWT_SECRET.');
  process.exit(1);
}

/**
 * Sanitizes MongoDB URI for safe logging (redacts username and password)
 * @param {string} uri
 * @returns {string} Redacted URI
 */
export function getSanitizedMongoUri(uri) {
  if (!uri) return '[not configured]';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@');
}

export const env = {
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV,
  isProduction,
  MONGODB_URI: (process.env.MONGODB_URI || '').trim(),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '',
};
