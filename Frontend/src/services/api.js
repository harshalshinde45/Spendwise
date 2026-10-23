/**
 * Central HTTP client for SpendWise API communications.
 */

const defaultBase = import.meta.env.PROD
  ? 'https://spendwise-uope.onrender.com/api'
  : '/api';

let rawBase = (import.meta.env.VITE_API_BASE_URL || defaultBase).trim().replace(/\/$/, '');
if (rawBase.startsWith('http') && !rawBase.endsWith('/api')) {
  rawBase = `${rawBase}/api`;
}
export const API_BASE_URL = rawBase;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Execute an HTTP request with error handling and JSON parsing.
 * @param {string} endpoint - Relative path (e.g. '/expenses')
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netError) {
    throw new ApiError(
      'Unable to connect to backend server. Please verify the Express backend is running on port 5001.',
      0,
      { isNetworkError: true }
    );
  }

  // Parse JSON response safely
  let responseData;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred while communicating with the server.';
    if (responseData && typeof responseData === 'object') {
      errorMessage =
        responseData.message ||
        responseData.error ||
        (Array.isArray(responseData.details) ? responseData.details.join(' ') : errorMessage);
    }

    throw new ApiError(errorMessage, response.status, responseData);
  }

  return responseData;
}
