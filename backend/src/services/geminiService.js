import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env.js';
import {
  ALLOWED_CATEGORIES,
  MAX_AMOUNT_PAISE,
  MAX_DESCRIPTION_LENGTH,
  isValidCalendarDate,
} from '../utils/validation.js';

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

    // If already mapped with status and internal error code, propagate
    if (err.status && err.code) throw err;

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
    } else if (
      lower.includes('not_found') ||
      lower.includes('not found') ||
      lower.includes('404') ||
      lower.includes('no longer available')
    ) {
      safeErr.status = 502;
      safeErr.code = 'AI_MODEL_UNAVAILABLE';
      safeErr.message = 'The configured Google Gemini model is unavailable or deprecated. Please check GEMINI_MODEL.';
    } else if (
      lower.includes('503') ||
      lower.includes('unavailable') ||
      lower.includes('high demand')
    ) {
      safeErr.status = 503;
      safeErr.code = 'AI_HIGH_DEMAND';
      safeErr.message = 'Google Gemini is currently experiencing temporary high demand. Please try again shortly.';
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

/**
 * Resolves a date string YYYY-MM-DD relative to a base date.
 * Timezone-neutral using UTC components.
 */
export function getRelativeDate(baseDateStr, daysOffset = 0) {
  if (!isValidCalendarDate(baseDateStr)) {
    baseDateStr = new Date().toISOString().split('T')[0];
  }
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

/**
 * Safely parses JSON strings, stripping markdown code fences if present.
 */
export function parseJsonSafely(text) {
  if (typeof text !== 'string') return null;
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Server-side validation and normalization of an extracted expense draft.
 * Guarantees that invalid, negative, out-of-range, or unsupported values cannot produce a valid save-ready draft.
 */
export function validateAndNormalizeDraft(parsed, { text, referenceDate }) {
  const missingFields = [];
  let clarificationNeeded = null;

  // 1. Validate Amount
  let amountPaise = null;
  let amountRupees = null;
  const rawAmount = parsed?.amount;

  if (typeof rawAmount === 'number' && !isNaN(rawAmount) && rawAmount > 0) {
    const paise = Math.round(rawAmount * 100);
    if (paise > 0 && paise <= MAX_AMOUNT_PAISE) {
      amountPaise = paise;
      amountRupees = Number((paise / 100).toFixed(2));
    } else {
      missingFields.push('amount');
    }
  } else {
    missingFields.push('amount');
  }

  // 2. Validate Category
  let category = 'Other';
  if (parsed?.category && typeof parsed.category === 'string') {
    const trimmedCat = parsed.category.trim();
    if (ALLOWED_CATEGORIES.includes(trimmedCat)) {
      category = trimmedCat;
    } else {
      const matched = ALLOWED_CATEGORIES.find(
        (c) => c.toLowerCase() === trimmedCat.toLowerCase()
      );
      category = matched || 'Other';
    }
  }

  // 3. Validate Date
  let date = '';
  const rawDate = parsed?.date;
  if (typeof rawDate === 'string' && isValidCalendarDate(rawDate.trim())) {
    date = rawDate.trim();
  } else {
    missingFields.push('date');
  }

  // 4. Validate Description
  let description = '';
  if (parsed?.description && typeof parsed.description === 'string') {
    description = parsed.description.trim().slice(0, MAX_DESCRIPTION_LENGTH);
  }
  if (!description) {
    description = text.trim().slice(0, MAX_DESCRIPTION_LENGTH);
  }

  const isComplete = missingFields.length === 0;

  if (!isComplete) {
    if (parsed?.clarificationNeeded && typeof parsed.clarificationNeeded === 'string') {
      clarificationNeeded = parsed.clarificationNeeded.trim();
    } else {
      clarificationNeeded = `Please specify the missing ${missingFields.join(' and ')} to complete this expense draft.`;
    }
  }

  return {
    draft: {
      amount: amountRupees,
      amountPaise,
      category,
      date,
      description,
      type: 'expense',
    },
    isComplete,
    missingFields,
    clarificationNeeded,
    rawInput: text,
  };
}

/**
 * Parses natural language expense text into a structured draft using Gemini.
 * Follows the zero-write guarantee: does NOT insert, update, or modify database records.
 * 
 * @param {Object} options
 * @param {string} options.text - User natural-language text (max 500 characters)
 * @param {string} [options.referenceDate] - YYYY-MM-DD anchor date (defaults to today)
 * @returns {Promise<Object>} Structured draft proposal
 */
export async function parseExpenseDescription({ text, referenceDate }) {
  const sanitizedText = sanitizePrompt(text, 500);
  if (!sanitizedText) {
    const err = new Error('Expense text cannot be empty.');
    err.status = 400;
    err.code = 'INVALID_INPUT';
    throw err;
  }

  const todayStr = isValidCalendarDate(referenceDate)
    ? referenceDate
    : new Date().toISOString().split('T')[0];

  const yesterdayStr = getRelativeDate(todayStr, -1);
  const dayBeforeYesterdayStr = getRelativeDate(todayStr, -2);

  const systemInstruction = `You are the SpendWise natural-language financial entry parser.
Your task is to analyze natural-language descriptions of personal expenses and extract structured financial details.

Reference Date Anchors:
- "today" corresponds to "${todayStr}".
- "yesterday" corresponds to "${yesterdayStr}".
- "day before yesterday" corresponds to "${dayBeforeYesterdayStr}".
- Specific dates (e.g. "15th Oct", "October 20") should be resolved to YYYY-MM-DD.
- If NO date or temporal reference is mentioned at all, set "date" to null. DO NOT fabricate or guess a date.

Extraction Rules:
1. "amount": The positive number in INR (Rupees). Set to null if missing, zero, or negative.
2. "category": Strictly one of: ${JSON.stringify(ALLOWED_CATEGORIES)}.
3. "description": Clean merchant or item description without currency amounts. Max 100 characters.
4. "date": YYYY-MM-DD string, or null if omitted/ambiguous.
5. "clarificationNeeded": If amount or date is missing, set a helpful prompt; otherwise null.`;

  const expenseSchema = {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: 'Clean description of the expense item or vendor without monetary words',
      },
      amount: {
        type: Type.NUMBER,
        description: 'The positive monetary amount in Rupees, or null if missing',
      },
      category: {
        type: Type.STRING,
        description: 'Permitted category: Food, Transport, Rent & Bills, Shopping, Education, Entertainment, Health, Personal Care, Other',
      },
      date: {
        type: Type.STRING,
        description: 'Calendar date in YYYY-MM-DD format, or null if missing/ambiguous',
      },
      clarificationNeeded: {
        type: Type.STRING,
        description: 'Question asking for missing information, or null if complete',
      },
    },
    required: ['description', 'category'],
  };

  const response = await generateContent({
    prompt: sanitizedText,
    systemInstruction,
    config: {
      responseMimeType: 'application/json',
      responseSchema: expenseSchema,
      temperature: 0.1, // Low temperature for high deterministic extraction accuracy
    },
    timeoutMs: 12000,
  });

  const parsed = parseJsonSafely(response.text);
  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('Failed to parse a valid structured response from Gemini.');
    err.status = 502;
    err.code = 'AI_MALFORMED_OUTPUT';
    throw err;
  }

  return validateAndNormalizeDraft(parsed, { text: sanitizedText, referenceDate: todayStr });
}
