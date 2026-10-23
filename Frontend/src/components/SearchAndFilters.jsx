import React, { useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import './SearchAndFilters.css';

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  minAmount = '',
  onMinAmountChange,
  maxAmount = '',
  onMaxAmountChange,
  sortBy,
  onSortChange,
  onClearFilters,
  totalResults,
}) {
  const [showAmountFilter, setShowAmountFilter] = useState(Boolean(minAmount || maxAmount));

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedCategory || minAmount || maxAmount || sortBy !== 'date-desc'
  );

  return (
    <div className="search-filters-container">
      <div className="search-filters-bar">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search transactions by title or category..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
            aria-label="Search transactions"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="filter-controls-group">
          {/* Category Filter */}
          <div className="select-wrapper">
            <label htmlFor="filter-category" className="visually-hidden">
              Filter by Category
            </label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Amount Range */}
          <button
            type="button"
            className={`btn btn-secondary btn-sm amount-toggle-btn ${showAmountFilter || minAmount || maxAmount ? 'active' : ''}`}
            onClick={() => setShowAmountFilter((prev) => !prev)}
            aria-expanded={showAmountFilter}
            title="Filter by amount range"
          >
            <SlidersHorizontal size={14} />
            <span>Amount</span>
          </button>

          {/* Sort Options */}
          <div className="select-wrapper">
            <label htmlFor="sort-by" className="visually-hidden">
              Sort transactions
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="filter-select sort-select"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount First</option>
              <option value="amount-asc">Lowest Amount First</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-subtle btn-sm clear-filters-btn"
              onClick={onClearFilters}
              title="Reset all filters"
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Amount Range Inputs */}
      {showAmountFilter && (
        <div className="amount-range-drawer">
          <div className="amount-input-pair">
            <label htmlFor="min-amount-input" className="amount-input-label">
              Min ₹
            </label>
            <input
              id="min-amount-input"
              type="number"
              min="0"
              placeholder="0"
              value={minAmount}
              onChange={(e) => onMinAmountChange?.(e.target.value)}
              className="form-input amount-filter-input"
            />
          </div>
          <span className="amount-range-sep">to</span>
          <div className="amount-input-pair">
            <label htmlFor="max-amount-input" className="amount-input-label">
              Max ₹
            </label>
            <input
              id="max-amount-input"
              type="number"
              min="0"
              placeholder="Any"
              value={maxAmount}
              onChange={(e) => onMaxAmountChange?.(e.target.value)}
              className="form-input amount-filter-input"
            />
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="active-filters-row" aria-label="Active filters">
          <span className="active-filters-label">Active filters:</span>
          {searchQuery.trim() && (
            <span className="filter-chip">
              Search: "{searchQuery.trim()}"
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => onSearchChange('')}
                aria-label="Remove search filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="filter-chip">
              Category: {selectedCategory}
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => onCategoryChange('')}
                aria-label="Remove category filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {minAmount && (
            <span className="filter-chip">
              Min: ₹{minAmount}
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => onMinAmountChange?.('')}
                aria-label="Remove minimum amount filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {maxAmount && (
            <span className="filter-chip">
              Max: ₹{maxAmount}
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => onMaxAmountChange?.('')}
                aria-label="Remove maximum amount filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {sortBy !== 'date-desc' && (
            <span className="filter-chip">
              Sorted: {sortBy.replace('-', ' ')}
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => onSortChange('date-desc')}
                aria-label="Reset sorting"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
