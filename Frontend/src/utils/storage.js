/**
 * Safe LocalStorage abstraction for SpendWise.
 * Includes schema validation, corruption recovery, and quota handling.
 */

export const STORAGE_KEYS = {
  EXPENSES: 'spendwise:v1:expenses',
  BUDGETS: 'spendwise:v1:budgets',
  SETTINGS: 'spendwise:v1:settings',
  THEME: 'spendwise:v1:theme',
};

/**
 * Validate an individual expense record loaded from storage.
 * @param {any} item 
 * @returns {boolean}
 */
export function isValidStoredExpense(item) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || !item.id.trim()) return false;
  if (typeof item.amountPaise !== 'number' || isNaN(item.amountPaise) || item.amountPaise <= 0) return false;
  if (typeof item.category !== 'string' || !item.category.trim()) return false;
  if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return false;
  return true;
}

/**
 * Validate budgets dictionary loaded from storage.
 * Expected shape: { "YYYY-MM": number, ... }
 * @param {any} data 
 * @returns {boolean}
 */
export function isValidStoredBudgets(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  for (const [key, val] of Object.entries(data)) {
    if (!/^\d{4}-\d{2}$/.test(key)) return false;
    if (typeof val !== 'number' || isNaN(val) || val < 0) return false;
  }
  return true;
}

/**
 * Safe read from localStorage with corruption recovery.
 * 
 * @template T
 * @param {string} key 
 * @param {T} fallback 
 * @param {(data: any) => boolean} [validator]
 * @returns {{ data: T, error?: string, wasCorrupt?: boolean }}
 */
export function safeGetItem(key, fallback, validator) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { data: fallback, error: 'LocalStorage is not available in this environment.' };
    }

    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return { data: fallback };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.warn(`[SpendWise Storage] Corrupted JSON detected for key "${key}":`, parseError);
      return {
        data: fallback,
        error: `Stored data for ${key} was corrupted and could not be parsed.`,
        wasCorrupt: true,
      };
    }

    if (validator && !validator(parsed)) {
      console.warn(`[SpendWise Storage] Data failed schema validation for key "${key}".`);
      return {
        data: fallback,
        error: `Stored data for ${key} does not match expected format.`,
        wasCorrupt: true,
      };
    }

    return { data: parsed };
  } catch (err) {
    console.error(`[SpendWise Storage] Read error for key "${key}":`, err);
    return { data: fallback, error: err.message || 'Error reading from storage.' };
  }
}

/**
 * Safe write to localStorage with error handling (e.g. QuotaExceededError).
 * 
 * @param {string} key 
 * @param {any} value 
 * @returns {{ success: boolean, error?: string }}
 */
export function safeSetItem(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { success: false, error: 'LocalStorage is not available.' };
    }

    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return { success: true };
  } catch (err) {
    console.error(`[SpendWise Storage] Write error for key "${key}":`, err);
    let message = 'Failed to save data locally.';
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      message = 'Local storage quota exceeded. Please export and clear old records.';
    }
    return { success: false, error: message };
  }
}

/**
 * Clear all SpendWise data keys.
 * @returns {{ success: boolean, error?: string }}
 */
export function clearSpendWiseStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { success: false, error: 'LocalStorage is not available.' };
    }

    window.localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    window.localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Error clearing storage.' };
  }
}

/**
 * Export all expenses and budgets to a JSON string.
 * @param {Array<Object>} expenses 
 * @param {Object.<string, number>} budgets 
 * @returns {string} Formatted JSON string
 */
export function exportToJSONString(expenses, budgets) {
  const exportPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    currency: 'INR',
    unit: 'paise',
    expenses: expenses || [],
    budgets: budgets || {},
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Export expenses to a CSV string.
 * @param {Array<Object>} expenses 
 * @returns {string} CSV format
 */
export function exportToCSVString(expenses = []) {
  const headers = ['ID', 'Date', 'Category', 'Amount (INR)', 'Amount (Paise)', 'Description', 'CreatedAt'];
  const rows = expenses.map(exp => {
    const rupees = ((exp.amountPaise || 0) / 100).toFixed(2);
    const escapedDesc = `"${(exp.description || '').replace(/"/g, '""')}"`;
    return [
      exp.id,
      exp.date,
      `"${exp.category}"`,
      rupees,
      exp.amountPaise,
      escapedDesc,
      exp.createdAt || '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Validate imported JSON backup structure.
 * @param {string} jsonString 
 * @returns {{ isValid: boolean, error?: string, data?: { expenses: Array, budgets: Object } }}
 */
export function parseAndValidateImport(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Imported file does not contain a valid JSON object.' };
    }

    const expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
    const validExpenses = expenses.filter(isValidStoredExpense);

    const rawBudgets = parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : {};
    const validBudgets = {};
    for (const [k, v] of Object.entries(rawBudgets)) {
      if (/^\d{4}-\d{2}$/.test(k) && typeof v === 'number' && v >= 0) {
        validBudgets[k] = Math.round(v);
      }
    }

    if (validExpenses.length === 0 && Object.keys(validBudgets).length === 0) {
      return { isValid: false, error: 'No valid expenses or budgets found in the imported file.' };
    }

    return {
      isValid: true,
      data: {
        expenses: validExpenses,
        budgets: validBudgets,
      },
    };
  } catch (err) {
    return { isValid: false, error: 'Invalid JSON file: ' + err.message };
  }
}
