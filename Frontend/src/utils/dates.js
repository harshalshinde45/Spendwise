/**
 * Date utility functions for SpendWise.
 * Guarantees local calendar dates without UTC timezone shifts.
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in the local timezone.
 * @returns {string} YYYY-MM-DD
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current month key formatted as YYYY-MM in the local timezone.
 * @returns {string} YYYY-MM
 */
export function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Extracts the YYYY-MM month key from a YYYY-MM-DD date string.
 * @param {string} dateStr - e.g. "2026-10-23"
 * @returns {string} e.g. "2026-10"
 */
export function getMonthKeyFromDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return getCurrentMonthKey();
  return dateStr.slice(0, 7);
}

/**
 * Format a YYYY-MM-DD date string into a readable local date (e.g. "23 Oct 2026").
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatDateReadable(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  // Construct local date without timezone shifts
  const d = new Date(year, monthIndex, day);
  if (isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a YYYY-MM month key into a readable month and year (e.g. "October 2026").
 * @param {string} monthKey 
 * @returns {string}
 */
export function formatMonthReadable(monthKey) {
  if (!monthKey || typeof monthKey !== 'string') return '';
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;

  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;

  const d = new Date(year, monthIndex, 1);
  if (isNaN(d.getTime())) return monthKey;

  return d.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get the previous month key from a given YYYY-MM key.
 * @param {string} monthKey 
 * @returns {string}
 */
export function getPreviousMonthKey(monthKey) {
  const parts = (monthKey || getCurrentMonthKey()).split('-');
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) - 1;

  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Get the next month key from a given YYYY-MM key.
 * @param {string} monthKey 
 * @returns {string}
 */
export function getNextMonthKey(monthKey) {
  const parts = (monthKey || getCurrentMonthKey()).split('-');
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) + 1;

  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Calculate the number of days remaining in a given month.
 * For the current calendar month, counts days remaining including today.
 * For past months, returns 0.
 * For future months, returns the total days in that month.
 * @param {string} monthKey - YYYY-MM
 * @returns {number}
 */
export function getDaysRemainingInMonth(monthKey) {
  if (!monthKey || typeof monthKey !== 'string') return 0;
  const parts = monthKey.split('-');
  if (parts.length !== 2) return 0;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return 0;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // Past month
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 0;
  }

  // Future month
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return totalDaysInMonth;
  }

  // Current month: days remaining including today
  const remainingDays = totalDaysInMonth - currentDay + 1;
  return Math.max(1, remainingDays);
}

/**
 * Validate that a string matches YYYY-MM-DD and is a genuine calendar date.
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}
