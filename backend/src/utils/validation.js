import mongoose from 'mongoose';

export const ALLOWED_CATEGORIES = [
  'Food',
  'Transport',
  'Rent & Bills',
  'Shopping',
  'Education',
  'Entertainment',
  'Health',
  'Personal Care',
  'Other',
];

export const MAX_AMOUNT_PAISE = 999999999; // ₹99,99,999.99
export const MAX_DESCRIPTION_LENGTH = 120;

/**
 * Validate calendar date YYYY-MM-DD
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isValidCalendarDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

/**
 * Validate month key YYYY-MM
 * @param {string} monthStr 
 * @returns {boolean}
 */
export function isValidMonthKey(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return false;
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[2], 10);
  return month >= 1 && month <= 12;
}

/**
 * Validate MongoDB ObjectId
 * @param {string} id 
 * @returns {boolean}
 */
export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Validate expense creation/update payload
 * @param {Object} data 
 * @returns {{ isValid: boolean, errors: string[], sanitized?: Object }}
 */
export function validateExpenseInput(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object.'] };
  }

  const { amountPaise, category, date, description } = data;

  // Amount validation
  if (amountPaise === undefined || amountPaise === null) {
    errors.push('amountPaise is required.');
  } else if (typeof amountPaise !== 'number' || isNaN(amountPaise)) {
    errors.push('amountPaise must be a valid number.');
  } else if (!Number.isInteger(amountPaise)) {
    errors.push('amountPaise must be an integer representing minor units (paise). Fractional paise are not permitted.');
  } else if (amountPaise <= 0) {
    errors.push('amountPaise must be greater than zero.');
  } else if (amountPaise > MAX_AMOUNT_PAISE) {
    errors.push(`amountPaise cannot exceed ₹99,99,999.99 (${MAX_AMOUNT_PAISE} paise).`);
  }

  // Category validation
  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('category is required.');
  } else if (!ALLOWED_CATEGORIES.includes(category.trim())) {
    errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`);
  }

  // Date validation
  if (!date || typeof date !== 'string') {
    errors.push('date is required.');
  } else if (!isValidCalendarDate(date.trim())) {
    errors.push('date must be a valid calendar date in YYYY-MM-DD format.');
  }

  // Description validation
  const sanitizedDesc = typeof description === 'string' ? description.trim() : '';
  if (sanitizedDesc.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    sanitized: {
      amountPaise,
      category: category.trim(),
      date: date.trim(),
      description: sanitizedDesc,
    },
  };
}

/**
 * Validate budget input
 * @param {Object} data 
 * @returns {{ isValid: boolean, errors: string[], sanitized?: Object }}
 */
export function validateBudgetInput(month, data) {
  const errors = [];

  if (!isValidMonthKey(month)) {
    errors.push('Invalid month format. Expected YYYY-MM (e.g. 2026-10).');
  }

  if (!data || typeof data !== 'object') {
    errors.push('Request body must be a JSON object.');
    return { isValid: false, errors };
  }

  const { amountPaise } = data;

  if (amountPaise === undefined || amountPaise === null) {
    errors.push('amountPaise is required.');
  } else if (typeof amountPaise !== 'number' || isNaN(amountPaise)) {
    errors.push('amountPaise must be a valid number.');
  } else if (!Number.isInteger(amountPaise)) {
    errors.push('amountPaise must be an integer representing minor units (paise).');
  } else if (amountPaise < 0) {
    errors.push('amountPaise cannot be negative.');
  } else if (amountPaise > MAX_AMOUNT_PAISE) {
    errors.push(`amountPaise cannot exceed ₹99,99,999.99 (${MAX_AMOUNT_PAISE} paise).`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    sanitized: {
      month,
      amountPaise,
    },
  };
}
