import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatINR, paiseToRupees } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import { Activity, Calendar } from 'lucide-react';
import './SpendingActivityChart.css';

export function SpendingActivityChart({ expenses = [], selectedMonth = '' }) {
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'

  const monthLabel = formatMonthReadable(selectedMonth);

  // Group actual expenses into daily or weekly aggregates
  const chartData = useMemo(() => {
    if (!selectedMonth) return [];

    const parts = selectedMonth.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const totalDays = !isNaN(year) && !isNaN(month) ? new Date(year, month, 0).getDate() : 30;

    const monthExpenses = expenses.filter(
      (e) => e && typeof e.date === 'string' && e.date.startsWith(selectedMonth)
    );

    if (viewMode === 'daily') {
      const dailyMap = new Map();
      for (let day = 1; day <= totalDays; day++) {
        const dayKey = `${selectedMonth}-${String(day).padStart(2, '0')}`;
        dailyMap.set(dayKey, { day, date: dayKey, totalPaise: 0, count: 0 });
      }

      for (const exp of monthExpenses) {
        if (dailyMap.has(exp.date)) {
          const entry = dailyMap.get(exp.date);
          entry.totalPaise += exp.amountPaise || 0;
          entry.count += 1;
        }
      }

      return Array.from(dailyMap.values()).map((d) => ({
        label: `${d.day}`,
        fullDate: d.date,
        totalRupees: paiseToRupees(d.totalPaise),
        totalPaise: d.totalPaise,
        count: d.count,
      }));
    } else {
      // Weekly aggregation (Weeks 1 to 5)
      const weekMap = new Map();
      for (let w = 1; w <= 5; w++) {
        weekMap.set(w, { week: `Week ${w}`, totalPaise: 0, count: 0 });
      }

      for (const exp of monthExpenses) {
        const dayNum = parseInt(exp.date.slice(8, 10), 10);
        if (!isNaN(dayNum)) {
          const weekNum = Math.min(5, Math.ceil(dayNum / 7));
          const wEntry = weekMap.get(weekNum);
          if (wEntry) {
            wEntry.totalPaise += exp.amountPaise || 0;
            wEntry.count += 1;
          }
        }
      }

      return Array.from(weekMap.values()).map((w) => ({
        label: w.week,
        totalRupees: paiseToRupees(w.totalPaise),
        totalPaise: w.totalPaise,
        count: w.count,
      }));
    }
  }, [expenses, selectedMonth, viewMode]);

  const hasExpenses = chartData.some((d) => d.totalPaise > 0);

  // Custom accessible tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="activity-tooltip" role="tooltip">
          <span className="tooltip-title">
            {viewMode === 'daily' ? `Day ${data.label} (${data.fullDate})` : data.label}
          </span>
          <span className="tooltip-amount">{formatINR(data.totalPaise)}</span>
          <span className="tooltip-sub">
            {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card spending-activity-card">
      <div className="activity-card-header">
        <div className="activity-title-group">
          <div className="activity-icon-wrap">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="activity-card-title">Spending Over Time</h3>
            <p className="activity-card-subtitle">{monthLabel}</p>
          </div>
        </div>

        <div className="activity-view-toggle" role="group" aria-label="Chart time granularity">
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            Daily
          </button>
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="activity-chart-canvas" style={{ width: '100%', height: 230 }}>
        {!hasExpenses ? (
          <div className="activity-empty-state">
            <Calendar size={28} className="activity-empty-icon" />
            <p>No activity recorded in {monthLabel}</p>
            <span>Transactions added for this month will chart here in real-time.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="totalRupees"
                stroke="var(--accent-primary)"
                strokeWidth={2.2}
                fillOpacity={1}
                fill="url(#spendGradient)"
                activeDot={{ r: 5, fill: 'var(--accent-primary)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
