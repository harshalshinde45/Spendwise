import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import { Gauge, Clock, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import './SpendingSpeedometer.css';

export function SpendingSpeedometer() {
  const { spendingSpeedometer, selectedMonth, openBudgetModal } = useExpense();

  if (!spendingSpeedometer) return null;

  const {
    isConfigured,
    budgetSpentPercent,
    monthElapsedPercent,
    daysElapsed,
    daysRemaining,
    totalDaysInMonth,
    avgDailySpendPaise,
    paceRatio,
    speedLevel,
    speedLabel,
    exhaustionDayEstimate,
    exhaustionNote,
    insightSummary,
  } = spendingSpeedometer;

  const monthLabel = formatMonthReadable(selectedMonth);

  if (!isConfigured) {
    return (
      <div className="card speedometer-card speedometer-unset">
        <div className="speedometer-header">
          <div className="speedometer-title-group">
            <div className="speedometer-icon-wrap">
              <Gauge size={18} />
            </div>
            <div>
              <h3 className="speedometer-title">Spending Speedometer</h3>
              <p className="speedometer-subtitle">Velocity & Run-out Projections</p>
            </div>
          </div>
        </div>
        <div className="speedometer-unset-body">
          <p>
            Set a monthly budget to calculate your spending velocity and forecast when funds are projected to deplete.
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={openBudgetModal}>
            Set Budget for {monthLabel}
          </button>
        </div>
      </div>
    );
  }

  // Calculate visual gauge fill: 0 to 180 degrees
  // Normalize pace ratio: 1.0 is center (90 deg), 0.5 is 45 deg, 1.5 is 135 deg, 2.0+ is 180 deg
  const clampedPace = Math.min(2.0, Math.max(0, paceRatio));
  const needleRotationDeg = Math.round((clampedPace / 2.0) * 180) - 90; // -90 deg to +90 deg

  return (
    <div className={`card speedometer-card speed-${speedLevel.toLowerCase()}`}>
      {/* Card Header */}
      <div className="speedometer-header">
        <div className="speedometer-title-group">
          <div className="speedometer-icon-wrap">
            <Gauge size={18} />
          </div>
          <div>
            <h3 className="speedometer-title">Spending Speedometer</h3>
            <p className="speedometer-subtitle">Budget Consumption Velocity • {monthLabel}</p>
          </div>
        </div>

        <div className="speedometer-badge-group">
          <span className={`speed-badge badge-${speedLevel.toLowerCase()}`}>
            {speedLabel} ({paceRatio}× pace)
          </span>
        </div>
      </div>

      {/* Main Speedometer Visual and Metric Comparison */}
      <div className="speedometer-body">
        {/* Dual Progress Comparison Tracks */}
        <div className="speedometer-comparison-section">
          {/* Budget Track */}
          <div className="speed-track-block">
            <div className="speed-track-header">
              <span className="track-label">Budget Consumed</span>
              <span className="track-value font-mono">
                <strong>{budgetSpentPercent}%</strong>
              </span>
            </div>
            <div className="speed-track-bar">
              <div
                className={`speed-fill fill-budget speed-${speedLevel.toLowerCase()}`}
                style={{ width: `${Math.min(100, budgetSpentPercent)}%` }}
              />
            </div>
          </div>

          {/* Month Elapsed Track */}
          <div className="speed-track-block">
            <div className="speed-track-header">
              <span className="track-label">Month Elapsed</span>
              <span className="track-value font-mono">
                {monthElapsedPercent}% ({daysElapsed}/{totalDaysInMonth} days)
              </span>
            </div>
            <div className="speed-track-bar">
              <div
                className="speed-fill fill-calendar"
                style={{ width: `${Math.min(100, monthElapsedPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Insight Quote Box */}
        <div className="speedometer-insight-box">
          <p className="speedometer-insight-text">
            "{insightSummary}"
          </p>
        </div>

        {/* Stats Grid */}
        <div className="speedometer-stats-grid">
          <div className="speed-stat-item">
            <span className="speed-stat-label">
              <Clock size={13} aria-hidden="true" />
              <span>Observed Daily Burn</span>
            </span>
            <span className="speed-stat-val font-mono">{formatINR(avgDailySpendPaise)} / day</span>
          </div>

          <div className="speed-stat-item">
            <span className="speed-stat-label">
              <Calendar size={13} aria-hidden="true" />
              <span>Depletion Forecast</span>
            </span>
            <span className="speed-stat-val font-mono">
              {exhaustionDayEstimate ? `Day ${exhaustionDayEstimate}` : 'End of Month +'}
            </span>
            <span className="speed-stat-helper">
              {exhaustionNote} (estimate)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
