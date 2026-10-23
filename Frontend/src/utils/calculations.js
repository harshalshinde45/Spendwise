import { CATEGORIES } from '../data/categories';
import { getDaysRemainingInMonth } from './dates';
import { formatINR } from './currency';

/**
 * Filter expenses for a specific month key (YYYY-MM).
 * @param {Array<Object>} expenses 
 * @param {string} monthKey 
 * @returns {Array<Object>}
 */
export function getExpensesForMonth(expenses = [], monthKey) {
  if (!Array.isArray(expenses) || !monthKey) return [];
  return expenses.filter(exp => exp && typeof exp.date === 'string' && exp.date.startsWith(monthKey));
}

/**
 * Calculate total spending in paise for a specific month.
 * @param {Array<Object>} expenses 
 * @param {string} monthKey 
 * @returns {number} Total in paise
 */
export function calculateMonthlyTotal(expenses = [], monthKey) {
  const monthExpenses = getExpensesForMonth(expenses, monthKey);
  return monthExpenses.reduce((sum, exp) => sum + (Number(exp.amountPaise) || 0), 0);
}

/**
 * Calculate spending breakdown by category for a specific month.
 * @param {Array<Object>} expenses 
 * @param {string} monthKey 
 * @returns {Array<{ id: string, name: string, color: string, bgColor: string, iconName: string, totalPaise: number, percentage: number, count: number }>}
 */
export function calculateCategoryTotals(expenses = [], monthKey) {
  const monthExpenses = getExpensesForMonth(expenses, monthKey);
  const totalMonthPaise = monthExpenses.reduce((sum, exp) => sum + (Number(exp.amountPaise) || 0), 0);

  // Group by category name
  const categoryMap = new Map();

  for (const exp of monthExpenses) {
    const catName = exp.category || 'Other';
    const amount = Number(exp.amountPaise) || 0;
    const existing = categoryMap.get(catName) || { totalPaise: 0, count: 0 };
    categoryMap.set(catName, {
      totalPaise: existing.totalPaise + amount,
      count: existing.count + 1,
    });
  }

  // Map to CATEGORIES metadata, including any custom or unknown category
  const results = [];
  for (const catDef of CATEGORIES) {
    const data = categoryMap.get(catDef.name);
    if (data && data.totalPaise > 0) {
      const percentage = totalMonthPaise > 0 ? (data.totalPaise / totalMonthPaise) * 100 : 0;
      results.push({
        id: catDef.id,
        name: catDef.name,
        color: catDef.color,
        bgColor: catDef.bgColor,
        iconName: catDef.iconName,
        totalPaise: data.totalPaise,
        percentage: Number(percentage.toFixed(1)),
        count: data.count,
      });
      categoryMap.delete(catDef.name);
    }
  }

  // Any remaining categories not in default list
  for (const [catName, data] of categoryMap.entries()) {
    if (data.totalPaise > 0) {
      const percentage = totalMonthPaise > 0 ? (data.totalPaise / totalMonthPaise) * 100 : 0;
      results.push({
        id: catName.toLowerCase().replace(/\s+/g, '-'),
        name: catName,
        color: '#656D60',
        bgColor: '#EFF0ED',
        iconName: 'CircleEllipsis',
        totalPaise: data.totalPaise,
        percentage: Number(percentage.toFixed(1)),
        count: data.count,
      });
    }
  }

  // Sort descending by total spending
  return results.sort((a, b) => b.totalPaise - a.totalPaise);
}

/**
 * Calculate budget status and metrics for a given budget and total spent.
 * 
 * @param {number} budgetPaise - Budget in paise (0 means not set)
 * @param {number} totalSpentPaise - Total spent in paise
 * @returns {{
 *   isSet: boolean,
 *   budgetPaise: number,
 *   spentPaise: number,
 *   remainingPaise: number,
 *   utilizationPercent: number,
 *   visualProgressPercent: number,
 *   isOverBudget: boolean,
 *   overspentPaise: number,
 *   statusLevel: 'unset' | 'healthy' | 'warning' | 'danger'
 * }}
 */
export function calculateBudgetStatus(budgetPaise = 0, totalSpentPaise = 0) {
  const budget = Number(budgetPaise) || 0;
  const spent = Number(totalSpentPaise) || 0;

  if (budget <= 0) {
    return {
      isSet: false,
      budgetPaise: 0,
      spentPaise: spent,
      remainingPaise: 0,
      utilizationPercent: 0,
      visualProgressPercent: 0,
      isOverBudget: false,
      overspentPaise: 0,
      statusLevel: 'unset',
    };
  }

  const remaining = budget - spent;
  const rawUtilization = (spent / budget) * 100;
  const isOverBudget = remaining < 0;
  const overspentPaise = isOverBudget ? Math.abs(remaining) : 0;
  const visualProgressPercent = Math.min(100, Math.max(0, rawUtilization));

  let statusLevel = 'healthy';
  if (rawUtilization >= 100) {
    statusLevel = 'danger';
  } else if (rawUtilization >= 80) {
    statusLevel = 'warning';
  }

  return {
    isSet: true,
    budgetPaise: budget,
    spentPaise: spent,
    remainingPaise: remaining,
    utilizationPercent: Number(rawUtilization.toFixed(1)),
    visualProgressPercent: Number(visualProgressPercent.toFixed(1)),
    isOverBudget,
    overspentPaise,
    statusLevel,
  };
}

/**
 * Sort transactions collection according to specified order.
 * @param {Array<Object>} expenses 
 * @param {'date-desc'|'date-asc'|'amount-desc'|'amount-asc'} sortBy 
 * @returns {Array<Object>}
 */
export function sortExpenses(expenses = [], sortBy = 'date-desc') {
  const copy = [...expenses];
  return copy.sort((a, b) => {
    if (sortBy === 'date-asc') {
      const cmp = (a.date || '').localeCompare(b.date || '');
      if (cmp !== 0) return cmp;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    }
    if (sortBy === 'amount-desc') {
      return (b.amountPaise || 0) - (a.amountPaise || 0);
    }
    if (sortBy === 'amount-asc') {
      return (a.amountPaise || 0) - (b.amountPaise || 0);
    }
    // Default: date-desc
    const cmp = (b.date || '').localeCompare(a.date || '');
    if (cmp !== 0) return cmp;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

/**
 * Calculate Smart Budget Alerts based on configured budget and spending metrics.
 * Alert thresholds:
 * - HEALTHY: > 30% remaining (no warning displayed)
 * - CAUTION: 15% to 30% remaining (non-intrusive reminder)
 * - LOW BUDGET: < 15% and > 0% remaining (prominent warning card + tips)
 * - BUDGET EXHAUSTED: remaining === 0
 * - OVER BUDGET: remaining < 0
 * - UNSET: budget not configured
 * 
 * @param {Object} params
 * @param {number} [params.budgetPaise=0] - Monthly budget in integer paise
 * @param {number} [params.totalSpentPaise=0] - Total spent in integer paise
 * @param {string} [params.monthKey=''] - YYYY-MM
 * @param {Array<Object>} [params.categoryTotals=[]] - Spending breakdown by category
 * @returns {{
 *   alertLevel: 'HEALTHY' | 'CAUTION' | 'LOW_BUDGET' | 'BUDGET_EXHAUSTED' | 'OVER_BUDGET' | 'UNSET',
 *   shouldDisplay: boolean,
 *   budgetPaise: number,
 *   spentPaise: number,
 *   remainingPaise: number,
 *   remainingPercent: number,
 *   utilizationPercent: number,
 *   visualProgressPercent: number,
 *   isOverBudget: boolean,
 *   overspentPaise: number,
 *   daysRemaining: number,
 *   dailySuggestionPaise: number,
 *   title: string,
 *   message: string,
 *   badgeText: string,
 *   variant: 'success' | 'warning' | 'danger' | 'neutral',
 *   tips: Array<string>
 * }}
 */
export function calculateSmartBudgetAlert({
  budgetPaise = 0,
  totalSpentPaise = 0,
  monthKey = '',
  categoryTotals = [],
} = {}) {
  const budget = Number(budgetPaise) || 0;
  const spent = Number(totalSpentPaise) || 0;
  const daysRemaining = getDaysRemainingInMonth(monthKey);

  // Handle zero or missing budget safely
  if (budget <= 0) {
    const tips = [
      'Set a monthly budget to monitor spending velocity, track progress, and receive daily spending suggestions.',
    ];
    if (spent > 0) {
      tips.push(
        `You have recorded ${formatINR(spent)} across ${categoryTotals.length} categor${categoryTotals.length === 1 ? 'y' : 'ies'} this month.`
      );
    }

    return {
      alertLevel: 'UNSET',
      shouldDisplay: true,
      budgetPaise: 0,
      spentPaise: spent,
      remainingPaise: 0,
      remainingPercent: 0,
      utilizationPercent: 0,
      visualProgressPercent: 0,
      isOverBudget: false,
      overspentPaise: 0,
      daysRemaining,
      dailySuggestionPaise: 0,
      title: 'No Monthly Budget Configured',
      message: 'Set a monthly spending target to monitor your utilization and receive budget alerts.',
      badgeText: 'Budget Unset',
      variant: 'neutral',
      tips,
    };
  }

  const remainingPaise = budget - spent;
  const rawRemainingPercent = (remainingPaise / budget) * 100;
  const remainingPercent = Number(rawRemainingPercent.toFixed(1));

  const rawUtilization = (spent / budget) * 100;
  const utilizationPercent = Number(rawUtilization.toFixed(1));
  const visualProgressPercent = Number(Math.min(100, Math.max(0, rawUtilization)).toFixed(1));

  const isOverBudget = remainingPaise < 0;
  const overspentPaise = isOverBudget ? Math.abs(remainingPaise) : 0;

  // Maximum suggested daily spending = max(0, remaining balance) / days remaining in current month
  // Safely non-negative and zero when budget is exhausted or over-budget
  const dailySuggestionPaise =
    remainingPaise > 0 && daysRemaining > 0
      ? Math.floor(remainingPaise / daysRemaining)
      : 0;

  let alertLevel = 'HEALTHY';
  let shouldDisplay = false;
  let variant = 'success';
  let title = 'Budget on Track';
  let message = '';
  let badgeText = 'On Track';
  const tips = [];

  // Categorize based on strict threshold conditions
  if (remainingPaise < 0) {
    // E. OVER BUDGET: Remaining balance is below zero
    alertLevel = 'OVER_BUDGET';
    shouldDisplay = true;
    variant = 'danger';
    title = 'Budget Exceeded';
    message = `You have exceeded your monthly budget by ${formatINR(overspentPaise)}.`;
    badgeText = 'Over Budget';

    tips.push(
      `The monthly budget has already been exceeded by ${formatINR(overspentPaise)}. Pause non-essential purchases for the rest of the month.`
    );

    if (categoryTotals && categoryTotals.length > 0) {
      const topCat = categoryTotals[0];
      if (topCat.percentage >= 40) {
        tips.push(
          `${topCat.name} accounts for ${Math.round(topCat.percentage)}% of your total spending (${formatINR(topCat.totalPaise)}). Review this category to identify where expenses went over limit.`
        );
      } else {
        tips.push(
          `Your highest spending category this month is ${topCat.name} at ${formatINR(topCat.totalPaise)} (${Math.round(topCat.percentage)}% of total). Review these expenses to understand where the budget was exceeded.`
        );
      }
    }

    tips.push(
      "Consider adjusting next month's budget target if this represents recurring necessary costs, or plan compensating savings."
    );
  } else if (remainingPaise === 0) {
    // D. BUDGET EXHAUSTED: Remaining balance equals zero
    alertLevel = 'BUDGET_EXHAUSTED';
    shouldDisplay = true;
    variant = 'danger';
    title = 'Budget Fully Exhausted';
    message = `Your monthly budget of ${formatINR(budget)} has been fully reached. Any further spending will exceed your budget.`;
    badgeText = 'Budget Exhausted';

    tips.push(
      `Your monthly budget of ${formatINR(budget)} has been 100% utilized. Pause non-essential purchases for the remainder of the month.`
    );

    if (categoryTotals && categoryTotals.length > 0) {
      const topCat = categoryTotals[0];
      tips.push(
        `Top spending category: ${topCat.name} with ${formatINR(topCat.totalPaise)} (${Math.round(topCat.percentage)}% of total spending).`
      );
    }

    tips.push('Prioritise only essential commitments until the next budget period.');
  } else if (rawRemainingPercent < 15) {
    // C. LOW BUDGET WARNING: Remaining percentage is below 15% and greater than 0%
    alertLevel = 'LOW_BUDGET';
    shouldDisplay = true;
    variant = 'danger';
    title = 'Low Budget Warning';
    message = `Only ${remainingPercent}% of your monthly budget remains (${formatINR(remainingPaise)} of ${formatINR(budget)}).`;
    badgeText = 'Low Budget';

    if (daysRemaining > 0 && dailySuggestionPaise > 0) {
      tips.push(
        `Suggested daily spending limit: ${formatINR(dailySuggestionPaise)}/day for the remaining ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. (Note: this is a suggested limit to stay within budget, not a guaranteed balance.)`
      );
    }

    tips.push('Prioritise essential expenses and defer non-critical purchases until next month.');

    if (categoryTotals && categoryTotals.length > 0) {
      const topCat = categoryTotals[0];
      if (topCat.percentage >= 40) {
        tips.push(
          `${topCat.name} represents ${Math.round(topCat.percentage)}% of spending (${formatINR(topCat.totalPaise)}). Look for potential savings or lower-cost alternatives here.`
        );
      } else {
        tips.push(
          `Review recent transactions in ${topCat.name} (${formatINR(topCat.totalPaise)}) to avoid unplanned expenses.`
        );
      }
    }
  } else if (rawRemainingPercent <= 30) {
    // B. CAUTION: Remaining percentage is >= 15% and <= 30%
    alertLevel = 'CAUTION';
    shouldDisplay = true;
    variant = 'warning';
    title = 'Budget Approaching Limit';
    message = `${remainingPercent}% of your monthly budget remains (${formatINR(remainingPaise)}). Consider pacing your spending for the rest of the month.`;
    badgeText = 'Budget Caution';

    if (daysRemaining > 0 && dailySuggestionPaise > 0) {
      tips.push(
        `Suggested daily spending limit: ${formatINR(dailySuggestionPaise)}/day for the remaining ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} to remain within budget.`
      );
    }

    if (categoryTotals && categoryTotals.length > 0 && categoryTotals[0].percentage >= 40) {
      tips.push(
        `${categoryTotals[0].name} accounts for ${Math.round(categoryTotals[0].percentage)}% of your expenses (${formatINR(categoryTotals[0].totalPaise)}). Keep an eye on upcoming transactions in this category.`
      );
    }

    tips.push('Review recent purchases and pace discretionary spending over the coming weeks.');
  } else {
    // A. HEALTHY: Remaining percentage is greater than 30%
    alertLevel = 'HEALTHY';
    shouldDisplay = false; // Do not display a warning
    variant = 'success';
    title = 'Budget on Track';
    message = `${remainingPercent}% of your monthly budget remains (${formatINR(remainingPaise)}). Spending is within healthy limits.`;
    badgeText = 'On Track';
  }

  return {
    alertLevel,
    shouldDisplay,
    budgetPaise: budget,
    spentPaise: spent,
    remainingPaise,
    remainingPercent,
    utilizationPercent,
    visualProgressPercent,
    isOverBudget,
    overspentPaise,
    daysRemaining,
    dailySuggestionPaise,
    title,
    message,
    badgeText,
    variant,
    tips,
  };
}
