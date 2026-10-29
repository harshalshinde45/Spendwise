import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

let aiClient = null;

/**
 * Returns whether Google Gemini is configured and available.
 * @returns {boolean}
 */
export function isAIAvailable() {
  return Boolean(env.isGeminiConfigured && env.GEMINI_API_KEY);
}

/**
 * Retrieves or initializes the singleton GoogleGenAI client.
 * Returns null if the API key is not configured.
 * @returns {GoogleGenAI|null}
 */
export function getGeminiClient() {
  if (!isAIAvailable()) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Reset client instance (useful for unit testing with different configs).
 */
export function resetClientForTesting() {
  aiClient = null;
}

/**
 * Sanitizes input prompt strings, strips harmful non-printable control characters,
 * and enforces maximum length constraints.
 * 
 * @param {string} text - Raw input string
 * @param {number} [maxLength=1000] - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizePrompt(text, maxLength = 1000) {
  if (typeof text !== 'string') return '';
  // Strip null bytes and non-printable control characters (except standard newlines/tabs)
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Executes a structured content generation call using the official Google Gen AI SDK.
 * Includes timeout protection, prompt sanitization, and structured error mapping.
 * 
 * @param {Object} options
 * @param {string} options.prompt - The input prompt to send to Gemini
 * @param {string} [options.systemInstruction] - Optional system persona instruction
 * @param {Object} [options.config] - Optional generation configuration (e.g. responseMimeType, responseSchema)
 * @param {number} [options.timeoutMs=12000] - Maximum execution time before aborting (default: 12s)
 * @returns {Promise<{ text: string, usageMetadata?: Object }>}
 */
export async function generateContent({
  prompt,
  systemInstruction,
  config = {},
  timeoutMs = 12000,
}) {
  if (!isAIAvailable()) {
    const err = new Error(
      'Google Gemini is not configured. Please set GEMINI_API_KEY in backend/.env to enable AI features.'
    );
    err.status = 503;
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const sanitizedPrompt = sanitizePrompt(prompt);
  if (!sanitizedPrompt) {
    const err = new Error('AI prompt cannot be empty or contain only whitespace.');
    err.status = 400;
    err.code = 'INVALID_PROMPT';
    throw err;
  }

  const client = getGeminiClient();
  if (!client) {
    const err = new Error('Unable to initialize Google GenAI client.');
    err.status = 503;
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }

  const generationConfig = {
    ...config,
  };

  if (systemInstruction) {
    generationConfig.systemInstruction = sanitizePrompt(systemInstruction, 2000);
  }

  // Timeout protection
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`AI request timed out after ${timeoutMs}ms.`);
      err.status = 504;
      err.code = 'AI_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  try {
    const apiPromise = client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: sanitizedPrompt,
      config: generationConfig,
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    const text = response?.text || '';
    return {
      text,
      usageMetadata: response?.usageMetadata || null,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    // If already mapped with status, propagate
    if (err.status) throw err;

    // Safely parse and map upstream Google GenAI SDK errors without exposing secrets
    const errorMessage = err.message || '';
    const lower = errorMessage.toLowerCase();

    const safeErr = new Error();

    if (
      lower.includes('api_key') ||
      lower.includes('api key') ||
      lower.includes('unauthenticated') ||
      lower.includes('403') ||
      lower.includes('permission_denied')
    ) {
      safeErr.status = 503;
      safeErr.code = 'AI_AUTHENTICATION_FAILED';
      safeErr.message = 'The configured Google Gemini API key is invalid or unauthorized.';
    } else if (
      lower.includes('quota') ||
      lower.includes('resource_exhausted') ||
      lower.includes('429')
    ) {
      safeErr.status = 429;
      safeErr.code = 'AI_QUOTA_EXCEEDED';
      safeErr.message = 'Google Gemini rate limit or quota exceeded. Please try again shortly.';
    } else if (lower.includes('safety') || lower.includes('blocked')) {
      safeErr.status = 400;
      safeErr.code = 'AI_CONTENT_BLOCKED';
      safeErr.message = 'The request or response was flagged by safety filters.';
    } else {
      safeErr.status = 502;
      safeErr.code = 'AI_UPSTREAM_ERROR';
      safeErr.message = 'An unexpected error occurred while communicating with Google Gemini.';
    }

    throw safeErr;
  }
}
