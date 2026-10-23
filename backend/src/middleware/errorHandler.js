/**
 * Centralized error-handling middleware for the SpendWise Express backend.
 * Sanitizes errors and returns consistent JSON error envelopes without exposing stack traces or sensitive credentials.
 */
export function errorHandler(err, req, res, next) {
  // If response headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  console.error('[SpendWise Backend Error]:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      details: messages,
    });
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid Identifier',
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    let message = `A record with that ${field} already exists.`;
    if (field === 'email') {
      message = 'An account with this email address already exists.';
    } else if (field === 'month') {
      message = 'A budget for this month already exists. You can update it anytime.';
    }
    return res.status(409).json({
      error: 'Duplicate Entry',
      message,
    });
  }

  // Fallback internal server error (never leak raw stack or connection string)
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Server Error',
    message: statusCode === 500 ? 'An unexpected server error occurred. Please try again later.' : err.message,
  });
}

/**
 * 404 Not Found fallback middleware for unhandled routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}
