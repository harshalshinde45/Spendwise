import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'spendwise_jwt_secret_dev_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token for an authenticated user.
 */
export function generateToken(user) {
  const payload = {
    id: user.id || user._id.toString(),
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Express middleware to enforce authentication and extract user identity.
 */
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in to access your financial workspace.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Your session has expired. Please log in again to continue.',
      });
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or malformed authentication token. Please log in again.',
    });
  }
}
