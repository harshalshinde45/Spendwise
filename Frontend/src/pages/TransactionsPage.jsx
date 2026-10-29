import React, { useState, useEffect, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PageHeader } from '../components/PageHeader';
import { SearchAndFilters } from '../components/SearchAndFilters';
import { TransactionList } from '../components/TransactionList';
import { sortExpenses } from '../utils/calculations';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import { Filter, Layers } from 'lucide-react';
import './TransactionsPage.css';

export function TransactionsPage() {
  const {
    expenses,
    selectedMonth,
    monthlyExpenses,
  } = useExpense();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [scopeAllMonths, setScopeAllMonths] = useState(false);

  // Debounce search query to prevent heavy array filtering on every rapid keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const monthLabel = formatMonthReadable(selectedMonth);

  // Filter and sort transactions
  const filteredAndSortedExpenses = useMemo(() => {
    // 1. Initial pool based on month scope
    const basePool = scopeAllMonths ? expenses : monthlyExpenses;

    // 2. Filter by debounced search query (matches description or category)
    const query = debouncedSearchQuery.trim().toLowerCase();
    let result = query
      ? basePool.filter((exp) => {
          const matchDesc = (exp.description || '').toLowerCase().includes(query);
          const matchCat = (exp.category || '').toLowerCase().includes(query);
          return matchDesc || matchCat;
        })
      : basePool;

    // 3. Filter by category
    if (selectedCategory) {
      result = result.filter(
        (exp) => exp.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 4. Filter by min amount (rupees to paise)
    const minVal = parseFloat(minAmount);
    if (!isNaN(minVal) && minVal > 0) {
      const minPaise = Math.round(minVal * 100);
      result = result.filter((exp) => (exp.amountPaise || 0) >= minPaise);
    }

    // 5. Filter by max amount
    const maxVal = parseFloat(maxAmount);
    if (!isNaN(maxVal) && maxVal > 0) {
      const maxPaise = Math.round(maxVal * 100);
      result = result.filter((exp) => (exp.amountPaise || 0) <= maxPaise);
    }

    // 6. Sort
    return sortExpenses(result, sortBy);
  }, [
    expenses,
    monthlyExpenses,
    scopeAllMonths,
    searchQuery,
    selectedCategory,
    minAmount,
    maxAmount,
    sortBy,
  ]);

  const totalFilteredPaise = useMemo(() => {
    return filteredAndSortedExpenses.reduce((sum, exp) => sum + (exp.amountPaise || 0), 0);
  }, [filteredAndSortedExpenses]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date-desc');
  };

  const isFiltered = Boolean(
    searchQuery.trim() || selectedCategory || minAmount || maxAmount || sortBy !== 'date-desc'
  );

  return (
    <div className="transactions-page">
      <PageHeader
        title="Transactions"
        subtitle={
          scopeAllMonths
            ? 'Viewing all recorded transactions across all months'
            : `Expenses recorded for ${monthLabel}`
        }
        showMonthSelector={!scopeAllMonths}
        showAddExpense={false}
      />

      {/* Scope switch & Filter Bar */}
      <div className="transactions-control-card card">
        <div className="scope-toggle-row">
          <div className="scope-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!scopeAllMonths}
              className={`scope-tab ${!scopeAllMonths ? 'active' : ''}`}
              onClick={() => setScopeAllMonths(false)}
            >
              <Layers size={14} />
              <span>{monthLabel}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scopeAllMonths}
              className={`scope-tab ${scopeAllMonths ? 'active' : ''}`}
              onClick={() => setScopeAllMonths(true)}
            >
              <span>All Months ({expenses.length})</span>
            </button>
          </div>

          <div className="transactions-summary-stat">
            <span className="summary-count">
              {filteredAndSortedExpenses.length}{' '}
              {filteredAndSortedExpenses.length === 1 ? 'transaction' : 'transactions'}
            </span>
            <span className="summary-bullet">•</span>
            <span className="summary-total">Total: {formatINR(totalFilteredPaise)}</span>
          </div>
        </div>

        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          minAmount={minAmount}
          onMinAmountChange={setMinAmount}
          maxAmount={maxAmount}
          onMaxAmountChange={setMaxAmount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
          totalResults={filteredAndSortedExpenses.length}
        />
      </div>

      {/* Transaction List */}
      <section className="transactions-results-section" aria-label="Transactions list">
        <TransactionList
          expenses={filteredAndSortedExpenses}
          isFiltered={isFiltered}
          onResetFilters={handleClearFilters}
        />
      </section>
    </div>
  );
}
