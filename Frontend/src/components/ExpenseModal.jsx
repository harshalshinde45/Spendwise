import React, { useState, useEffect, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { CATEGORIES } from '../data/categories';
import { validateExpense, MAX_DESCRIPTION_LENGTH } from '../utils/validation';
import { getTodayDateString } from '../utils/dates';
import { paiseToInputValue } from '../utils/currency';
import { aiService } from '../services/aiService';
import { X, AlertCircle, Plus, Check, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import './ExpenseModal.css';

export function ExpenseModal() {
  const {
    isExpenseModalOpen,
    editingExpense,
    closeExpenseModal,
    addExpense,
    updateExpense,
  } = useExpense();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Natural-Language Entry States (Phase 2)
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' | 'ai'
  const [aiText, setAiText] = useState('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [isDraftActive, setIsDraftActive] = useState(false);
  const [aiClarification, setAiClarification] = useState(null);
  const [aiMissingFields, setAiMissingFields] = useState([]);

  const amountInputRef = useRef(null);

  // Initialize or reset form state whenever modal opens or editingExpense changes
  useEffect(() => {
    if (isExpenseModalOpen) {
      if (editingExpense) {
        setAmount(paiseToInputValue(editingExpense.amountPaise));
        setCategory(editingExpense.category || CATEGORIES[0].name);
        setDate(editingExpense.date || getTodayDateString());
        setDescription(editingExpense.description || '');
      } else {
        setAmount('');
        setCategory(CATEGORIES[0].name);
        setDate(getTodayDateString());
        setDescription('');
      }
      setErrors({});
      setIsSubmitting(false);

      // Reset AI draft states
      setEntryMode('manual');
      setAiText('');
      setIsParsingAI(false);
      setAiError(null);
      setIsDraftActive(false);
      setAiClarification(null);
      setAiMissingFields([]);

      // Focus the amount input
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  }, [isExpenseModalOpen, editingExpense]);

  // Handle ESC key
  useEffect(() => {
    if (isExpenseModalOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isSubmitting) {
          closeExpenseModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpenseModalOpen, closeExpenseModal, isSubmitting]);

  if (!isExpenseModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const validation = validateExpense({
      amount,
      category,
      date,
      description,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      let result;
      if (editingExpense) {
        result = await updateExpense(editingExpense.id, {
          amountPaise: validation.sanitized.amountPaise,
          category: validation.sanitized.category,
          date: validation.sanitized.date,
          description: validation.sanitized.description,
        });
      } else {
        result = await addExpense({
          amountPaise: validation.sanitized.amountPaise,
          category: validation.sanitized.category,
          date: validation.sanitized.date,
          description: validation.sanitized.description,
        });
      }

      // Close only upon verified success
      if (result) {
        closeExpenseModal();
      }
    } catch {
      // Kept open on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(editingExpense);

  const handleGenerateDraft = async (e) => {
    if (e) e.preventDefault();
    const trimmed = aiText.trim();
    if (!trimmed || isParsingAI) return;

    setIsParsingAI(true);
    setAiError(null);
    setAiClarification(null);

    try {
      const today = getTodayDateString();
      const result = await aiService.parseExpense(trimmed, today);

      if (result && result.draft) {
        // Populate form with draft values
        if (result.draft.amount != null) {
          setAmount(String(result.draft.amount));
        } else if (result.draft.amountPaise != null) {
          setAmount(paiseToInputValue(result.draft.amountPaise));
        }

        if (result.draft.category) {
          setCategory(result.draft.category);
        }

        if (result.draft.date) {
          setDate(result.draft.date);
        }

        if (result.draft.description) {
          setDescription(result.draft.description);
        }

        setIsDraftActive(true);
        setAiMissingFields(result.missingFields || []);
        setAiClarification(result.clarificationNeeded || null);
        setErrors({});
      } else {
        throw new Error('Received an unexpected draft format from the server.');
      }
    } catch (err) {
      // Preserve user's text in aiText and surface clear, safe error
      let userFriendlyMessage =
        err.message ||
        'Unable to generate draft with AI. Please check your connection or switch to manual entry.';

      if (
        (err.status === 404 || err.statusCode === 404) &&
        typeof err.message === 'string' &&
        err.message.includes('Cannot POST')
      ) {
        userFriendlyMessage =
          'AI parsing endpoint not found on backend. Please restart your backend server (npm run dev in backend) to activate newly mounted routes.';
      }

      setAiError(userFriendlyMessage);
    } finally {
      setIsParsingAI(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => !isSubmitting && closeExpenseModal()}>
      <div
        className="modal-content expense-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="expense-modal-title" className="modal-title">
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeExpenseModal}
            disabled={isSubmitting || isParsingAI}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Entry Mode Switcher (Visible only in Add Expense mode) */}
        {!isEditing && (
          <div className="entry-mode-tabs" role="tablist" aria-label="Expense input mode">
            <button
              type="button"
              role="tab"
              aria-selected={entryMode === 'manual'}
              className={`entry-mode-tab ${entryMode === 'manual' ? 'active' : ''}`}
              onClick={() => {
                setEntryMode('manual');
                setAiError(null);
              }}
            >
              <FileText size={14} />
              <span>Manual Entry</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={entryMode === 'ai'}
              className={`entry-mode-tab ${entryMode === 'ai' ? 'active' : ''}`}
              onClick={() => {
                setEntryMode('ai');
                setAiError(null);
              }}
            >
              <Sparkles size={14} className="sparkle-icon" />
              <span>Describe with AI</span>
            </button>
          </div>
        )}

        {/* AI Natural-Language Input Panel */}
        {!isEditing && entryMode === 'ai' && (
          <div className="ai-entry-panel">
            <div className="ai-entry-label">
              <span>Describe your expense in plain language</span>
              <span className="ai-char-counter">{aiText.length}/500</span>
            </div>
            <textarea
              id="ai-expense-text"
              className="ai-entry-textarea"
              rows={3}
              maxLength={500}
              placeholder='e.g. "I spent ₹180 on lunch at a restaurant today." or "Paid ₹350 for metro recharge yesterday"'
              value={aiText}
              disabled={isParsingAI || isSubmitting}
              onChange={(e) => {
                setAiText(e.target.value);
                if (aiError) setAiError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleGenerateDraft(e);
                }
              }}
            />

            {aiError && (
              <div className="ai-error-banner" role="alert">
                <AlertCircle size={15} />
                <span>{aiError}</span>
              </div>
            )}

            <div className="ai-action-row">
              <span className="ai-hint-text">
                Press <strong>Generate Draft</strong> to extract fields. No expense is saved automatically.
              </span>
              <button
                type="button"
                className="ai-generate-btn"
                onClick={handleGenerateDraft}
                disabled={isParsingAI || isSubmitting || !aiText.trim()}
              >
                {isParsingAI ? (
                  <>
                    <div className="btn-spinner" />
                    <span>Extracting with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* AI Draft Review Notice */}
        {isDraftActive && (
          <div className="ai-draft-notice-banner" role="status">
            <div className="draft-notice-header">
              <CheckCircle2 size={16} className="draft-success-icon" />
              <strong>AI Draft Ready for Review</strong>
            </div>
            <p className="draft-notice-desc">
              Review and edit any field below. Nothing is saved until you click <strong>Confirm &amp; Save Expense</strong>.
            </p>
            {aiClarification && (
              <div className="draft-clarification-tag">
                <AlertCircle size={13} />
                <span>{aiClarification}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="expense-form">
          {/* Amount Field (Frequently Used: 1st) */}
          <div className="form-group">
            <label htmlFor="expense-amount" className="form-label">
              Amount (₹) <span className="required-star">*</span>
            </label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix" aria-hidden="true">₹</span>
              <input
                ref={amountInputRef}
                id="expense-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                disabled={isSubmitting}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                className={`form-input amount-input ${errors.amount ? 'has-error' : ''}`}
                aria-required="true"
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
              />
            </div>
            {errors.amount && (
              <p id="expense-amount-error" className="form-error">
                <AlertCircle size={14} /> {errors.amount}
              </p>
            )}
          </div>

          {/* Category Field (Frequently Used: 2nd) */}
          <div className="form-group">
            <label htmlFor="expense-category" className="form-label">
              Category <span className="required-star">*</span>
            </label>
            <select
              id="expense-category"
              value={category}
              disabled={isSubmitting}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
              }}
              className={`form-select ${errors.category ? 'has-error' : ''}`}
              aria-required="true"
              aria-invalid={Boolean(errors.category)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="form-error">
                <AlertCircle size={14} /> {errors.category}
              </p>
            )}
          </div>

          {/* Date Field (Frequently Used: 3rd) */}
          <div className="form-group">
            <label htmlFor="expense-date" className="form-label">
              Date <span className="required-star">*</span>
            </label>
            <input
              id="expense-date"
              type="date"
              value={date}
              disabled={isSubmitting}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              className={`form-input font-mono ${errors.date ? 'has-error' : ''}`}
              aria-required="true"
              aria-invalid={Boolean(errors.date)}
            >
            </input>
            {errors.date && (
              <p className="form-error">
                <AlertCircle size={14} /> {errors.date}
              </p>
            )}
          </div>

          {/* Description Field (Frequently Used: 4th) */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="expense-description">Description</label>
              <span className="form-label-hint">
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <input
              id="expense-description"
              type="text"
              placeholder="e.g. Lunch with team or Groceries"
              value={description}
              disabled={isSubmitting}
              maxLength={MAX_DESCRIPTION_LENGTH}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              className={`form-input ${errors.description ? 'has-error' : ''}`}
            />
            {errors.description && (
              <p className="form-error">
                <AlertCircle size={14} /> {errors.description}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeExpenseModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isParsingAI}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : isEditing ? (
                <>
                  <Check size={16} />
                  <span>Save Changes</span>
                </>
              ) : isDraftActive ? (
                <>
                  <Check size={16} />
                  <span>Confirm &amp; Save Expense</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
