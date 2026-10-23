import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { formatINR, paiseToRupees } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';
import { PieChart as PieIcon, BarChart2, AlertCircle } from 'lucide-react';
import './CategoryChart.css';

export function CategoryChart({ categoryTotals = [], totalMonthPaise = 0 }) {
  const [chartType, setChartType] = useState('donut'); // 'donut' | 'bar'

  if (!categoryTotals || categoryTotals.length === 0 || totalMonthPaise === 0) {
    return (
      <div className="chart-empty-container">
        <div className="chart-empty-icon">
          <PieIcon size={32} />
        </div>
        <p className="chart-empty-text">No spending recorded for this month</p>
        <span className="chart-empty-subtext">
          Add expenses to see a visual breakdown of your spending habits by category.
        </span>
      </div>
    );
  }

  // Format data for Recharts (Recharts expects decimal numeric values)
  const chartData = categoryTotals.map((cat) => ({
    name: cat.name,
    totalRupees: paiseToRupees(cat.totalPaise),
    totalPaise: cat.totalPaise,
    percentage: cat.percentage,
    color: cat.color,
    count: cat.count,
    iconName: cat.iconName,
  }));

  // Custom accessible tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="custom-chart-tooltip" role="tooltip">
          <div className="tooltip-header" style={{ color: item.color }}>
            <span className="tooltip-name">{item.name}</span>
          </div>
          <div className="tooltip-body">
            <span className="tooltip-amount">{formatINR(item.totalPaise)}</span>
            <span className="tooltip-percent">
              {item.percentage}% ({item.count} {item.count === 1 ? 'transaction' : 'transactions'})
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="category-chart-wrapper">
      {/* Chart view switcher */}
      <div className="chart-controls-header">
        <h3 className="chart-heading">Spending by Category</h3>
        <div className="chart-view-toggle">
          <button
            type="button"
            className={`toggle-btn ${chartType === 'donut' ? 'active' : ''}`}
            onClick={() => setChartType('donut')}
            aria-label="View as Donut Chart"
          >
            <PieIcon size={14} />
            <span>Donut</span>
          </button>
          <button
            type="button"
            className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            aria-label="View as Bar Chart"
          >
            <BarChart2 size={14} />
            <span>Bar</span>
          </button>
        </div>
      </div>

      {/* Visual Chart Canvas */}
      <div className="chart-canvas-wrapper" style={{ height: 260 }}>
        {chartType === 'donut' ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="totalRupees"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
                stroke="var(--bg-surface)"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalRupees" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Text / Legend representation for full accessibility */}
      <div className="chart-legend-grid">
        {categoryTotals.map((cat) => (
          <div key={cat.id} className="legend-row">
            <div className="legend-left">
              <span
                className="legend-color-dot"
                style={{ backgroundColor: cat.color }}
                aria-hidden="true"
              />
              <CategoryIcon iconName={cat.iconName} size={15} color={cat.color} />
              <span className="legend-label">{cat.name}</span>
            </div>
            <div className="legend-right">
              <span className="legend-amount">{formatINR(cat.totalPaise)}</span>
              <span className="legend-percent">{cat.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
