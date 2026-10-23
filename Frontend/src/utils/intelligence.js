/**
 * Intelligence calculation engine for SpendWise.
 * Provides deterministic, data-driven financial insights without external AI dependencies:
 * 1. Financial Weather
 * 2. Spending Speedometer
 * 3. Expense Detective
 * 4. Financial Time Machine (Simulator)
 * 5. Survival Budget Mode
 */

import { formatINR, paiseToRupees } from './currency';
import { getDaysRemainingInMonth } from './dates';

/**
 * 1. Financial Weather Calculation
 * Calculates current financial climate based on remaining percentage and spending pace relative to days elapsed.
 * 
 * States:
 * - SUNNY: Plenty of budget remaining (> 30%) and spending pace is reasonable.
 * - CLOUDY: Spending progressing faster than expected for the month's progress.
 * - RAINY: Less than 15% of the monthly budget remains (> 0%).
 * - STORM: Budget exceeded (< 0 remaining).
 * - BUDGET_EXHAUSTED: Remaining budget is exactly zero.
 * - UNSET: No monthly budget configured.
 * 
 * @param {Object} params
 * @param {number} params.budgetPaise - Monthly budget in paise
 * @param {number} params.totalSpentPaise - Total spent in paise
 * @param {string} params.monthKey - YYYY-MM
 * @param {string} [params.currentDateStr] - Optional YYYY-MM-DD for testing
 * @returns {Object} Weather details
 */
export function calculateFinancialWeather({
  budgetPaise = 0,
  totalSpentPaise = 0,
  monthKey = '',
  currentDateStr = '',
} = {}) {
  const budget = Number(budgetPaise) || 0;
  const spent = Number(totalSpentPaise) || 0;

  if (budget <= 0) {
    return {
      state: 'UNSET',
      headline: 'Weather Inactive',
      description: 'Set a monthly budget to activate your real-time Financial Weather forecast.',
      iconName: 'CloudOff',
      badgeVariant: 'neutral',
      color: 'var(--text-muted)',
      temperature: null,
    };
  }

  const remaining = budget - spent;
  const remainingPercent = (remaining / budget) * 100;
  const spentPercent = (spent / budget) * 100;

  // Determine days elapsed in target month
  const parts = (monthKey || '').split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const totalDaysInMonth = !isNaN(year) && !isNaN(month) ? new Date(year, month, 0).getDate() : 30;

  const now = currentDateStr ? new Date(currentDateStr) : new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  let daysElapsed = totalDaysInMonth;
  if (year === currentYear && month === currentMonth) {
    daysElapsed = Math.min(totalDaysInMonth, Math.max(1, currentDay));
  } else if (year > currentYear || (year === currentYear && month > currentMonth)) {
    daysElapsed = 1; // Future month starting
  }

  const monthProgressRatio = daysElapsed / totalDaysInMonth;
  const budgetConsumedRatio = spent / budget;

  // Priority 1: Over Budget
  if (remaining < 0) {
    const overspent = Math.abs(remaining);
    return {
      state: 'STORM',
      headline: 'Storm Warning',
      description: `Spending has exceeded the monthly budget by ${formatINR(overspent)}. Non-essential expenses should be paused immediately.`,
      iconName: 'Zap',
      badgeVariant: 'storm',
      color: 'var(--status-danger)',
      remainingPercent: Number(remainingPercent.toFixed(1)),
    };
  }

  // Priority 2: Budget Exhausted
  if (remaining === 0) {
    return {
      state: 'BUDGET_EXHAUSTED',
      headline: 'Budget Exhausted',
      description: '100% of your allocated budget has been spent. Any further transaction will tip your status into a deficit.',
      iconName: 'CloudRain',
      badgeVariant: 'storm',
      color: 'var(--status-danger)',
      remainingPercent: 0,
    };
  }

  // Priority 3: Rainy (< 15% remaining)
  if (remainingPercent < 15) {
    return {
      state: 'RAINY',
      headline: 'Rainy Reserves',
      description: `Only ${remainingPercent.toFixed(1)}% of your monthly budget remains (${formatINR(remaining)}). Discretionary spending should be restrained.`,
      iconName: 'CloudRain',
      badgeVariant: 'rainy',
      color: 'var(--status-warning)',
      remainingPercent: Number(remainingPercent.toFixed(1)),
    };
  }

  // Priority 4: Cloudy (Spending pace faster than expected)
  // E.g., if spent 50% of budget when only 25% of month has passed
  const paceDivergence = budgetConsumedRatio - monthProgressRatio;
  if (paceDivergence > 0.15) {
    const excessPace = Math.round(paceDivergence * 100);
    return {
      state: 'CLOUDY',
      headline: 'Cloudy Horizon',
      description: `You have consumed ${spentPercent.toFixed(0)}% of your budget in ${Math.round(monthProgressRatio * 100)}% of the month (${daysElapsed}/${totalDaysInMonth} days). Spending velocity is running ${excessPace}% ahead of schedule.`,
      iconName: 'CloudSun',
      badgeVariant: 'cloudy',
      color: 'var(--status-warning)',
      remainingPercent: Number(remainingPercent.toFixed(1)),
    };
  }

  // Priority 5: Sunny (Plenty of budget remaining and pace is sustainable)
  return {
    state: 'SUNNY',
    headline: 'Sunny & Balanced',
    description: `Healthy financial pace with ${remainingPercent.toFixed(1)}% (${formatINR(remaining)}) available. Your spending rate is comfortably aligned with the calendar.`,
    iconName: 'Sun',
    badgeVariant: 'sunny',
    color: 'var(--accent-primary)',
    remainingPercent: Number(remainingPercent.toFixed(1)),
  };
}

/**
 * 2. Spending Speedometer Calculation
 * Compares budget consumption velocity against calendar days elapsed.
 * 
 * @param {Object} params
 * @param {number} params.budgetPaise
 * @param {number} params.totalSpentPaise
 * @param {string} params.monthKey
 * @param {string} [params.currentDateStr]
 * @returns {Object}
 */
export function calculateSpendingSpeedometer({
  budgetPaise = 0,
  totalSpentPaise = 0,
  monthKey = '',
  currentDateStr = '',
} = {}) {
  const budget = Number(budgetPaise) || 0;
  const spent = Number(totalSpentPaise) || 0;

  const parts = (monthKey || '').split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const totalDaysInMonth = !isNaN(year) && !isNaN(month) ? new Date(year, month, 0).getDate() : 30;

  const now = currentDateStr ? new Date(currentDateStr) : new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  let daysElapsed = totalDaysInMonth;
  if (year === currentYear && month === currentMonth) {
    daysElapsed = Math.min(totalDaysInMonth, Math.max(1, currentDay));
  } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
    daysElapsed = totalDaysInMonth; // Past month
  } else {
    daysElapsed = 1; // Future month
  }

  const daysRemaining = Math.max(0, totalDaysInMonth - daysElapsed + 1);

  if (budget <= 0) {
    return {
      isConfigured: false,
      budgetSpentPercent: 0,
      monthElapsedPercent: Math.round((daysElapsed / totalDaysInMonth) * 100),
      avgDailySpendPaise: daysElapsed > 0 ? Math.round(spent / daysElapsed) : 0,
      speedLevel: 'UNSET',
      speedLabel: 'No Budget Set',
      exhaustionDayEstimate: null,
      insightSummary: 'Set a monthly budget to monitor spending velocity and projected run-out dates.',
    };
  }

  const budgetSpentPercent = Number(((spent / budget) * 100).toFixed(1));
  const monthElapsedPercent = Number(((daysElapsed / totalDaysInMonth) * 100).toFixed(1));
  const avgDailySpendPaise = daysElapsed > 0 ? Math.round(spent / daysElapsed) : 0;

  // Pace ratio: > 1 means burning faster than time passing
  const paceRatio = monthElapsedPercent > 0 ? budgetSpentPercent / monthElapsedPercent : 0;

  let speedLevel = 'CRUISING'; // CRUISING | BALANCED | ACCELERATED | REDLINE
  let speedLabel = 'Cruising';

  if (spent >= budget) {
    speedLevel = 'REDLINE';
    speedLabel = spent > budget ? 'Over Budget' : 'Budget Reached';
  } else if (paceRatio > 1.35) {
    speedLevel = 'REDLINE';
    speedLabel = 'High Velocity';
  } else if (paceRatio > 1.1) {
    speedLevel = 'ACCELERATED';
    speedLabel = 'Pacing Fast';
  } else if (paceRatio >= 0.85) {
    speedLevel = 'BALANCED';
    speedLabel = 'Balanced Pace';
  } else {
    speedLevel = 'CRUISING';
    speedLabel = 'Gentle Pace';
  }

  // Estimated budget exhaustion day (linear projection based on observed average daily spend)
  let exhaustionDayEstimate = null;
  let exhaustionNote = '';

  if (spent >= budget) {
    exhaustionDayEstimate = daysElapsed;
    exhaustionNote = 'Budget already exhausted';
  } else if (avgDailySpendPaise > 0) {
    const daysUntilExhaust = Math.round((budget - spent) / avgDailySpendPaise);
    const projectedCalendarDay = daysElapsed + daysUntilExhaust;

    if (projectedCalendarDay <= totalDaysInMonth) {
      exhaustionDayEstimate = projectedCalendarDay;
      exhaustionNote = `Estimated exhaustion: Day ${projectedCalendarDay} of ${totalDaysInMonth} at current rate`;
    } else {
      exhaustionDayEstimate = null;
      exhaustionNote = 'Projected to last through the entire month';
    }
  } else {
    exhaustionNote = 'No spending observed yet this month';
  }

  // Formulate plain English summary
  let insightSummary = '';
  if (spent >= budget) {
    insightSummary = `You have utilized 100% of your budget in ${daysElapsed} of ${totalDaysInMonth} days.`;
  } else {
    insightSummary = `You have used ${budgetSpentPercent}% of your budget with ${monthElapsedPercent}% of the month elapsed (${daysElapsed}/${totalDaysInMonth} days).`;
  }

  return {
    isConfigured: true,
    budgetSpentPercent,
    monthElapsedPercent,
    daysElapsed,
    daysRemaining,
    totalDaysInMonth,
    avgDailySpendPaise,
    paceRatio: Number(paceRatio.toFixed(2)),
    speedLevel,
    speedLabel,
    exhaustionDayEstimate,
    exhaustionNote,
    insightSummary,
  };
}

/**
 * 3. Expense Detective Engine
 * Discovers statistical patterns in the user's actual transaction history.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.expenses - All expenses
 * @param {string} params.selectedMonth - YYYY-MM
 * @param {Array<Object>} [params.categoryTotals=[]]
 * @returns {Array<Object>} List of actionable, factual insights
 */
export function calculateExpenseDetective({
  expenses = [],
  selectedMonth = '',
  categoryTotals = [],
} = {}) {
  if (!Array.isArray(expenses) || !selectedMonth) return [];

  const currentMonthExpenses = expenses.filter(
    (e) => e && typeof e.date === 'string' && e.date.startsWith(selectedMonth)
  );

  if (currentMonthExpenses.length === 0) return [];

  const insights = [];

  // A. Top Category Concentration Insight
  if (categoryTotals && categoryTotals.length > 0) {
    const topCat = categoryTotals[0];
    if (topCat.percentage >= 35) {
      insights.push({
        id: `detective-topcat-${selectedMonth}`,
        type: 'concentration',
        iconName: 'PieChart',
        title: 'High Category Concentration',
        observation: `${topCat.name} accounts for ${topCat.percentage}% of all your monthly expenditures (${formatINR(topCat.totalPaise)} across ${topCat.count} purchases).`,
        explanation: 'Over one-third of total monthly spending is concentrated in this single category.',
        severity: topCat.percentage >= 50 ? 'warning' : 'neutral',
        category: topCat.name,
      });
    }
  }

  // B. Micro-Transactions Analysis (Purchases <= ₹200)
  const microExpenses = currentMonthExpenses.filter((e) => (e.amountPaise || 0) <= 20000);
  if (microExpenses.length >= 4) {
    const microTotalPaise = microExpenses.reduce((sum, e) => sum + (e.amountPaise || 0), 0);
    insights.push({
      id: `detective-micro-${selectedMonth}`,
      type: 'micro_transactions',
      iconName: 'Receipt',
      title: 'Frequent Micro-Purchases',
      observation: `You made ${microExpenses.length} purchases under ₹200, accumulating to ${formatINR(microTotalPaise)}.`,
      explanation: 'Small daily transactions can quietly compound into a notable monthly sum.',
      severity: 'neutral',
    });
  }

  // C. Unusually Expensive Outliers (Transactions > 2.5x the month's median)
  const sortedAmounts = [...currentMonthExpenses]
    .map((e) => e.amountPaise || 0)
    .sort((a, b) => a - b);
  const mid = Math.floor(sortedAmounts.length / 2);
  const medianAmountPaise =
    sortedAmounts.length % 2 !== 0
      ? sortedAmounts[mid]
      : Math.round((sortedAmounts[mid - 1] + sortedAmounts[mid]) / 2);

  if (medianAmountPaise > 0) {
    const outliers = currentMonthExpenses.filter(
      (e) => (e.amountPaise || 0) >= medianAmountPaise * 2.8 && (e.amountPaise || 0) >= 150000 // at least ₹1500
    );
    if (outliers.length > 0) {
      const highest = outliers.sort((a, b) => b.amountPaise - a.amountPaise)[0];
      insights.push({
        id: `detective-outlier-${highest.id || selectedMonth}`,
        type: 'outlier',
        iconName: 'TrendingUp',
        title: 'Unusually Large Transaction',
        observation: `"${highest.description || highest.category}" on ${highest.date} was ${formatINR(highest.amountPaise)}, which is ${(highest.amountPaise / medianAmountPaise).toFixed(1)}× higher than your median expense (${formatINR(medianAmountPaise)}).`,
        explanation: 'This single purchase had an outsized impact on this month\'s budget utilization.',
        severity: 'warning',
      });
    }
  }

  // D. Weekend vs Weekday Spending Divergence
  let weekendTotalPaise = 0;
  let weekendCount = 0;
  let weekdayTotalPaise = 0;
  let weekdayCount = 0;

  for (const exp of currentMonthExpenses) {
    const d = new Date(exp.date);
    if (!isNaN(d.getTime())) {
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendTotalPaise += exp.amountPaise || 0;
        weekendCount += 1;
      } else {
        weekdayTotalPaise += exp.amountPaise || 0;
        weekdayCount += 1;
      }
    }
  }

  if (weekendCount >= 2 && weekdayCount >= 4) {
    const avgWeekendPaise = Math.round(weekendTotalPaise / weekendCount);
    const avgWeekdayPaise = Math.round(weekdayTotalPaise / weekdayCount);

    if (avgWeekendPaise >= avgWeekdayPaise * 1.4) {
      const ratio = (avgWeekendPaise / avgWeekdayPaise).toFixed(1);
      insights.push({
        id: `detective-weekend-${selectedMonth}`,
        type: 'weekend_spending',
        iconName: 'Calendar',
        title: 'Weekend Spending Acceleration',
        observation: `Your average weekend transaction (${formatINR(avgWeekendPaise)}) is ${ratio}× higher than your weekday average (${formatINR(avgWeekdayPaise)}).`,
        explanation: 'Discretionary weekend leisure or shopping causes higher per-transaction outflow.',
        severity: 'neutral',
      });
    }
  }

  // E. Month-over-Month Category Trend Comparison
  const parts = selectedMonth.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const prevMonthKey = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const prevMonthExpenses = expenses.filter(
    (e) => e && typeof e.date === 'string' && e.date.startsWith(prevMonthKey)
  );

  if (prevMonthExpenses.length >= 3 && categoryTotals && categoryTotals.length > 0) {
    const prevCatMap = new Map();
    for (const exp of prevMonthExpenses) {
      const cat = exp.category || 'Other';
      prevCatMap.set(cat, (prevCatMap.get(cat) || 0) + (exp.amountPaise || 0));
    }

    for (const currCat of categoryTotals) {
      const prevPaise = prevCatMap.get(currCat.name);
      if (prevPaise && prevPaise >= 50000 && currCat.totalPaise >= 50000) {
        const changePercent = Math.round(((currCat.totalPaise - prevPaise) / prevPaise) * 100);
        if (changePercent >= 25) {
          insights.push({
            id: `detective-trend-${currCat.name}-${selectedMonth}`,
            type: 'category_trend',
            iconName: 'ArrowUpRight',
            title: `${currCat.name} Spending Surge`,
            observation: `Your ${currCat.name} spending increased by ${changePercent}% compared with last month (${formatINR(currCat.totalPaise)} vs ${formatINR(prevPaise)}).`,
            explanation: `Observed trend across ${currCat.count} transactions in ${selectedMonth} vs previous period.`,
            severity: changePercent >= 50 ? 'warning' : 'neutral',
            category: currCat.name,
          });
          break; // Show most significant shift
        }
      }
    }
  }

  return insights;
}

/**
 * 4. Financial Time Machine Simulator
 * Simulates a hypothetical purchase decision and calculates resulting financial state.
 * Never modifies database or actual financial records.
 * 
 * @param {Object} params
 * @param {number} params.budgetPaise - Configured budget in paise
 * @param {number} params.totalSpentPaise - Current spent in paise
 * @param {string} params.monthKey - YYYY-MM
 * @param {number} params.purchaseAmountPaise - Proposed purchase in paise
 * @param {string} [params.category=''] - Proposed purchase category
 * @param {string} [params.timing='now'] - 'now' | 'postpone'
 * @returns {Object} Simulation results with comparison scenarios
 */
export function simulateFinancialPurchase({
  budgetPaise = 0,
  totalSpentPaise = 0,
  monthKey = '',
  purchaseAmountPaise = 0,
  category = 'General',
  timing = 'now',
} = {}) {
  const budget = Number(budgetPaise) || 0;
  const currentSpent = Number(totalSpentPaise) || 0;
  const purchase = Math.max(0, Number(purchaseAmountPaise) || 0);

  const daysRemaining = getDaysRemainingInMonth(monthKey);
  const currentRemaining = budget - currentSpent;
  const currentDailyLimit =
    currentRemaining > 0 && daysRemaining > 0 ? Math.floor(currentRemaining / daysRemaining) : 0;

  // Immediate purchase scenario
  const simulatedSpent = currentSpent + purchase;
  const simulatedRemaining = budget - simulatedSpent;
  const simulatedUtilizationPercent =
    budget > 0 ? Number(((simulatedSpent / budget) * 100).toFixed(1)) : 0;
  const simulatedDailyLimit =
    simulatedRemaining > 0 && daysRemaining > 0
      ? Math.floor(simulatedRemaining / daysRemaining)
      : 0;

  const isExceeded = simulatedRemaining < 0;
  const shortfallPaise = isExceeded ? Math.abs(simulatedRemaining) : 0;

  // Cheaper alternative scenario (e.g. 35% lower cost)
  const cheaperAmount = Math.round(purchase * 0.65);
  const cheaperRemaining = currentRemaining - cheaperAmount;
  const cheaperDailyLimit =
    cheaperRemaining > 0 && daysRemaining > 0 ? Math.floor(cheaperRemaining / daysRemaining) : 0;

  return {
    isBudgetConfigured: budget > 0,
    budgetPaise: budget,
    currentSpentPaise: currentSpent,
    currentRemainingPaise: currentRemaining,
    currentDailyLimitPaise: currentDailyLimit,
    purchaseAmountPaise: purchase,
    category,
    timing,
    daysRemaining,

    // Impact
    simulatedSpentPaise: simulatedSpent,
    simulatedRemainingPaise: simulatedRemaining,
    simulatedUtilizationPercent,
    simulatedDailyLimitPaise: simulatedDailyLimit,
    isExceeded,
    shortfallPaise,
    dailyImpactPaise: currentDailyLimit - simulatedDailyLimit,

    // Scenario comparisons
    scenarios: {
      now: {
        label: 'Purchase Now',
        remainingPaise: simulatedRemaining,
        dailyLimitPaise: simulatedDailyLimit,
        impactSummary: isExceeded
          ? `Exceeds current budget by ${formatINR(shortfallPaise)}`
          : `Leaves ${formatINR(simulatedRemaining)} for the remaining ${daysRemaining} days`,
      },
      postpone: {
        label: 'Postpone to Next Month',
        remainingPaise: currentRemaining,
        dailyLimitPaise: currentDailyLimit,
        impactSummary: `Preserves ${formatINR(currentRemaining)} in your current monthly budget`,
      },
      cheaperAlternative: {
        label: 'Cheaper Alternative (-35%)',
        amountPaise: cheaperAmount,
        savingsPaise: purchase - cheaperAmount,
        remainingPaise: cheaperRemaining,
        dailyLimitPaise: cheaperDailyLimit,
        impactSummary: `Saves ${formatINR(purchase - cheaperAmount)} and leaves ${formatINR(cheaperRemaining)} in reserve`,
      },
    },
  };
}

/**
 * 5. Survival Budget Mode Engine
 * Allows users to plan essential commitments (Food, Travel, Rent, Utilities, Health)
 * and calculates true discretionary daily allowance.
 * 
 * @param {Object} params
 * @param {number} params.remainingBudgetPaise - Remaining monthly budget
 * @param {number} params.daysRemaining - Days remaining in current month
 * @param {Object} params.plannedEssentials - Map of planned categories to amounts in paise
 * @returns {Object}
 */
export function calculateSurvivalBudget({
  remainingBudgetPaise = 0,
  daysRemaining = 1,
  plannedEssentials = {},
} = {}) {
  const remaining = Number(remainingBudgetPaise) || 0;
  const days = Math.max(1, Number(daysRemaining) || 1);

  // Calculate sum of planned essential amounts
  let totalPlannedPaise = 0;
  for (const amount of Object.values(plannedEssentials)) {
    totalPlannedPaise += Math.max(0, Number(amount) || 0);
  }

  const availableDiscretionaryPaise = remaining - totalPlannedPaise;
  const dailyDiscretionaryPaise =
    availableDiscretionaryPaise > 0 ? Math.floor(availableDiscretionaryPaise / days) : 0;

  const hasShortfall = availableDiscretionaryPaise < 0;
  const shortfallPaise = hasShortfall ? Math.abs(availableDiscretionaryPaise) : 0;

  let advice = '';
  if (hasShortfall) {
    advice = `Your planned essentials exceed available funds by ${formatINR(shortfallPaise)}. Prioritize essential food and transit, and explore trimming non-mandatory bills.`;
  } else if (dailyDiscretionaryPaise < 10000) {
    // Under ₹100/day
    advice = `Tight safety margin: ${formatINR(dailyDiscretionaryPaise)}/day discretionary buffer. Stick strictly to essentials until the next budget cycle.`;
  } else {
    advice = `Comfortable buffer: You have ${formatINR(dailyDiscretionaryPaise)}/day for discretionary spending after securing all essential obligations.`;
  }

  return {
    remainingBudgetPaise: remaining,
    totalPlannedEssentialsPaise: totalPlannedPaise,
    availableDiscretionaryPaise,
    dailyDiscretionaryPaise,
    daysRemaining: days,
    hasShortfall,
    shortfallPaise,
    advice,
  };
}
