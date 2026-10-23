import { CATEGORY_NAMES } from '../data/categories';
import { isValidDateString } from './dates';

export const MAX_AMOUNT_RUPEES = 9999999.99; // ₹99,99,999.99
export const MAX_AMOUNT_PAISE = 999999999;
export const MAX_DESCRIPTION_LENGTH = 120;

/**
 * Validate an expense input before saving.
 * 
 * @param {Object} fields
 * @param {string|number} fields.amount - User input amount in Rupees
 * @param {string} fields.category - Selected category name
 * @param {string} fields.date - Date in YYYY-MM-DD
 * @param {string} [fields.description] - Optional description
 * @returns {{ isValid: boolean, errors: Object.<string, string>, sanitized: { amountPaise: number, category: string, date: string, description: string } }}
 */
export function validateExpense({ amount, category, date, description }) {
  const errors = {};

  // 1. Amount validation
  let amountPaise = 0;
  if (amount === undefined || amount === null || String(amount).trim() === '') {
    errors.amount = 'Amount is required.';
  } else {
    const trimmedAmount = String(amount).trim();
    // Check format: digits, optional decimal point with at most 2 digits
    const validNumberRegex = /^(?:\d+)(?:\.\d{1,2})?$/;
    if (!validNumberRegex.test(trimmedAmount)) {
      errors.amount = 'Enter a valid positive amount with up to 2 decimal places.';
    } else {
      const num = parseFloat(trimmedAmount);
      if (isNaN(num) || !isFinite(num)) {
        errors.amount = 'Amount must be a valid finite number.';
      } else if (num <= 0) {
        errors.amount = 'Amount must be greater than zero.';
      } else if (num > MAX_AMOUNT_RUPEES) {
        errors.amount = `Amount cannot exceed ₹99,99,999.99.`;
      } else {
        amountPaise = Math.round(num * 100);
        if (amountPaise <= 0) {
          errors.amount = 'Amount must be at least ₹0.01 (1 paisa).';
        }
      }
    }
  }

  // 2. Category validation
  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.category = 'Please select a category.';
  } else if (!CATEGORY_NAMES.includes(category.trim())) {
    errors.category = 'Selected category is not recognized.';
  }

  // 3. Date validation
  if (!date || typeof date !== 'string' || !date.trim()) {
    errors.date = 'Date is required.';
  } else if (!isValidDateString(date.trim())) {
    errors.date = 'Please provide a valid calendar date (YYYY-MM-DD).';
  }

  // 4. Description validation
  const sanitizedDesc = (description || '').trim();
  if (sanitizedDesc.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      amountPaise,
      category: (category || '').trim(),
      date: (date || '').trim(),
      description: sanitizedDesc,
    },
  };
}

/**
 * Validate a monthly budget input.
 * 
 * @param {string|number} amount - Rupee amount
 * @returns {{ isValid: boolean, error?: string, budgetPaise: number }}
 */
export function validateBudget(amount) {
  if (amount === undefined || amount === null || String(amount).trim() === '') {
    // Empty can mean unset / 0
    return { isValid: true, budgetPaise: 0 };
  }

  const trimmed = String(amount).trim();
  const validNumberRegex = /^(?:\d+)(?:\.\d{1,2})?$/;
  if (!validNumberRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Enter a valid non-negative amount with at most 2 decimal places.',
      budgetPaise: 0,
    };
  }

  const num = parseFloat(trimmed);
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: 'Budget must be a finite number.', budgetPaise: 0 };
  }

  if (num < 0) {
    return { isValid: false, error: 'Budget cannot be negative.', budgetPaise: 0 };
  }

  if (num > MAX_AMOUNT_RUPEES) {
    return { isValid: false, error: 'Budget cannot exceed ₹99,99,999.99.', budgetPaise: 0 };
  }

  return {
    isValid: true,
    budgetPaise: Math.round(num * 100),
  };
}
