import React from 'react';
import './SummaryCard.css';

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  progress,
  onClick,
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`card summary-card ${isClickable ? 'clickable' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="summary-card-top">
        <span className="summary-card-title">{title}</span>
        {Icon && (
          <div className="summary-card-icon">
            <Icon size={18} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="summary-card-value">{value}</div>

      {typeof progress === 'number' && (
        <div className="summary-card-progress">
          <div
            className="summary-progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${title}: ${progress}%`}
          >
            <div
              className={`summary-progress-fill fill-${badgeVariant || 'neutral'}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      <div className="summary-card-bottom">
        {subtitle && <span className="summary-card-subtitle">{subtitle}</span>}
        {badgeText && (
          <span className={`badge badge-${badgeVariant}`}>{badgeText}</span>
        )}
      </div>
    </div>
  );
}
