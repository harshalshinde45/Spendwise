/**
 * Currency utility module for SpendWise.
 * Follows Rule: Store monetary values internally as integer minor units (paise: 1 Rupee = 100 Paise).
 * This eliminates IEEE-754 binary floating point precision artifacts.
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_FORMATTER_NO_DECIMAL = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Convert integer paise to decimal rupees (for user input fields or mathematical operations).
 * @param {number} paise - Integer amount in paise (e.g., 4599)
 * @returns {number} Decimal amount in rupees (e.g., 45.99)
 */
export function paiseToRupees(paise) {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return paise / 100;
}

/**
 * Convert a rupee string or number to integer paise with safe rounding.
 * e.g., "45.99" -> 4599, 45.5 -> 4550, 100 -> 10000
 * @param {number|string} rupees - Rupee amount
 * @returns {number} Integer amount in paise
 */
export function rupeesToPaise(rupees) {
  if (rupees === undefined || rupees === null || rupees === '') return 0;
  const num = typeof rupees === 'string' ? parseFloat(rupees.trim()) : rupees;
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Format integer paise into Indian Rupee currency string (e.g. ₹4,599.00 or -₹250.00).
 * @param {number} paise - Amount in paise
 * @param {Object} [options]
 * @param {boolean} [options.compactDecimals=false] - If true and paise % 100 === 0, omit paise
 * @param {boolean} [options.absolute=false] - If true, format absolute value without negative sign
 * @returns {string} Formatted INR currency string
 */
export function formatINR(paise, options = {}) {
  const { compactDecimals = false, absolute = false } = options;
  if (typeof paise !== 'number' || isNaN(paise)) {
    return '₹0.00';
  }

  const rawPaise = absolute ? Math.abs(paise) : paise;
  const rupeeValue = rawPaise / 100;

  if (compactDecimals && rawPaise % 100 === 0) {
    return INR_FORMATTER_NO_DECIMAL.format(rupeeValue);
  }

  return INR_FORMATTER.format(rupeeValue);
}

/**
 * Format paise for form inputs (plain decimal string like "45.99").
 * @param {number} paise 
 * @returns {string}
 */
export function paiseToInputValue(paise) {
  if (typeof paise !== 'number' || isNaN(paise) || paise === 0) return '';
  return (paise / 100).toFixed(2).replace(/\.00$/, '');
}
