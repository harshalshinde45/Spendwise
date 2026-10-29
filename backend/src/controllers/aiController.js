import { env } from '../config/env.js';
import { isAIAvailable, generateContent, sanitizePrompt } from '../services/geminiService.js';

const MAX_PING_MESSAGE_LENGTH = 300;

/**
 * GET /api/ai/status
 * Returns Google Gemini configuration and readiness state.
 * Requires authentication.
 */
export async function getAIStatus(req, res) {
  const configured = isAIAvailable();

  res.status(200).json({
    configured,
    model: configured ? env.GEMINI_MODEL : null,
    status: configured ? 'ready' : 'unconfigured',
    message: configured
      ? 'Google Gemini is configured and ready to process financial intelligence.'
      : 'Google Gemini is not configured. Please set GEMINI_API_KEY in backend/.env to activate AI features.',
  });
}

/**
 * POST /api/ai/ping
 * Lightweight connectivity and readiness verification endpoint for Google Gemini.
 * Validates user input, checks configuration, and executes a brief generation call.
 * 
 * Body:
 * { "message": "Optional test prompt (max 300 characters)" }
 */
export async function pingAI(req, res, next) {
  try {
    // 1. Check Gemini availability upfront
    if (!isAIAvailable()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        code: 'AI_NOT_CONFIGURED',
        message:
          'Google Gemini is not configured. Please configure GEMINI_API_KEY in your server environment to enable AI capabilities.',
      });
    }

    // 2. Validate input if provided
    const rawMessage = req.body?.message;

    if (rawMessage !== undefined && rawMessage !== null) {
      if (typeof rawMessage !== 'string') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'The message field must be a valid string.',
        });
      }

      if (rawMessage.length > MAX_PING_MESSAGE_LENGTH) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `The test message exceeds the maximum allowed length of ${MAX_PING_MESSAGE_LENGTH} characters.`,
        });
      }
    }

    const promptText = sanitizePrompt(rawMessage || 'Respond with a single short sentence confirming you are online and ready.');
    if (!promptText) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'The message cannot be empty or contain only whitespace.',
      });
    }

    // 3. Execute generation with timeout and safety constraints
    const result = await generateContent({
      prompt: promptText,
      systemInstruction: 'You are the SpendWise AI test responder. Keep your responses under 20 words.',
      timeoutMs: 10000,
    });

    res.status(200).json({
      status: 'ok',
      model: env.GEMINI_MODEL,
      response: result.text.trim(),
    });
  } catch (err) {
    if (err.status && err.code) {
      return res.status(err.status).json({
        error: err.name || 'AI Error',
        code: err.code,
        message: err.message,
      });
    }
    next(err);
  }
}
