import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatMonthReadable } from '../utils/dates';
import {
  Sun,
  CloudSun,
  CloudRain,
  Zap,
  CloudOff,
  Sparkles,
} from 'lucide-react';
import './FinancialWeather.css';

export function FinancialWeather() {
  const { financialWeather, selectedMonth, openBudgetModal } = useExpense();

  if (!financialWeather) return null;

  const { state, headline, description, badgeVariant } = financialWeather;
  const monthLabel = formatMonthReadable(selectedMonth);

  const renderWeatherIcon = () => {
    switch (state) {
      case 'SUNNY':
        return <Sun size={24} className="weather-icon-svg sunny-spin" aria-hidden="true" />;
      case 'CLOUDY':
        return <CloudSun size={24} className="weather-icon-svg" aria-hidden="true" />;
      case 'RAINY':
        return <CloudRain size={24} className="weather-icon-svg rainy-pulse" aria-hidden="true" />;
      case 'STORM':
      case 'BUDGET_EXHAUSTED':
        return <Zap size={24} className="weather-icon-svg storm-flash" aria-hidden="true" />;
      case 'UNSET':
      default:
        return <CloudOff size={24} className="weather-icon-svg" aria-hidden="true" />;
    }
  };

  return (
    <div
      className={`financial-weather-card weather-state-${badgeVariant}`}
      role="region"
      aria-label={`Financial Climate: ${headline}`}
    >
      <div className="weather-visual-col">
        <div className={`weather-icon-emblem emblem-${badgeVariant}`}>
          {renderWeatherIcon()}
        </div>
      </div>

      <div className="weather-text-col">
        <div className="weather-status-row">
          <span className="weather-status-tag">Financial Weather • {monthLabel}</span>
          <span className={`weather-badge badge-${badgeVariant}`}>{state.replace('_', ' ')}</span>
        </div>
        <h3 className="weather-headline">{headline}</h3>
        <p className="weather-description">{description}</p>
      </div>

      {state === 'UNSET' && (
        <div className="weather-action-col">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={openBudgetModal}
          >
            <span>Set Target</span>
          </button>
        </div>
      )}
    </div>
  );
}
