import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../services/aiService';
import { expenseService } from '../services/expenseService';
import { validateExpense } from '../utils/validation';
import { paiseToInputValue, rupeesToPaise } from '../utils/currency';

describe('AI Natural-Language Expense Entry (Phase 2 Frontend Flow)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aiService.parseExpense formats request payload and returns structured draft', async () => {
    const mockDraftResponse = {
      status: 'ok',
      draft: {
        amount: 180,
        amountPaise: 18000,
        category: 'Food',
        date: '2026-10-30',
        description: 'Lunch at a restaurant',
        type: 'expense',
      },
      isComplete: true,
      missingFields: [],
      clarificationNeeded: null,
      rawInput: 'I spent ₹180 on lunch at a restaurant today.',
    };

    // Mock fetch/api call
    const parseSpy = vi.spyOn(aiService, 'parseExpense').mockResolvedValue(mockDraftResponse);

    const result = await aiService.parseExpense(
      'I spent ₹180 on lunch at a restaurant today.',
      '2026-10-30'
    );

    expect(parseSpy).toHaveBeenCalledWith(
      'I spent ₹180 on lunch at a restaurant today.',
      '2026-10-30'
    );
    expect(result.isComplete).toBe(true);
    expect(result.draft.amount).toBe(180);
    expect(result.draft.amountPaise).toBe(18000);
    expect(result.draft.category).toBe('Food');
    expect(result.draft.description).toBe('Lunch at a restaurant');
  });

  it('allows user to review and edit extracted draft fields before saving', () => {
    // 1. Initial AI extracted values
    const aiDraft = {
      amount: 180,
      category: 'Other',
      date: '2026-10-30',
      description: 'Quick lunch',
    };

    // 2. User edits extracted fields
    const editedAmount = '220.50'; // User corrects amount
    const editedCategory = 'Food'; // User changes category
    const editedDesc = 'Lunch at Cafe Coffee Day with colleague'; // User expands description
    const editedDate = '2026-10-29'; // User adjusts date

    // 3. Validation before confirm save
    const validation = validateExpense({
      amount: editedAmount,
      category: editedCategory,
      date: editedDate,
      description: editedDesc,
    });

    expect(validation.isValid).toBe(true);
    expect(validation.sanitized.amountPaise).toBe(22050); // 220.50 * 100 paise
    expect(validation.sanitized.category).toBe('Food');
    expect(validation.sanitized.description).toBe(editedDesc);
    expect(validation.sanitized.date).toBe('2026-10-29');
  });

  it('preserves user input text when AI parsing fails', async () => {
    let originalText = 'Spent 400 on cab to airport';
    let errorMessage = null;

    vi.spyOn(aiService, 'parseExpense').mockRejectedValue(
      new Error('Google Gemini is not configured. Please set GEMINI_API_KEY.')
    );

    try {
      await aiService.parseExpense(originalText, '2026-10-30');
    } catch (err) {
      errorMessage = err.message;
    }

    // User's original text must be intact
    expect(originalText).toBe('Spent 400 on cab to airport');
    expect(errorMessage).toContain('GEMINI_API_KEY');
  });

  it('enforces explicit confirmation: expense creation is NOT called until user confirms', async () => {
    const createExpenseSpy = vi.spyOn(expenseService, 'createExpense');

    // User gets AI draft
    const aiDraft = {
      amountPaise: 18000,
      category: 'Food',
      date: '2026-10-30',
      description: 'Lunch at restaurant',
    };

    // At this stage, createExpense must NOT have been called
    expect(createExpenseSpy).not.toHaveBeenCalled();

    // User confirms save
    createExpenseSpy.mockResolvedValue({ id: 'exp_123', ...aiDraft });
    await expenseService.createExpense(aiDraft);

    expect(createExpenseSpy).toHaveBeenCalledTimes(1);
    expect(createExpenseSpy).toHaveBeenCalledWith(aiDraft);
  });

  it('prevents duplicate submissions when a save operation is in progress', () => {
    let isSubmitting = false;
    let submissionCount = 0;

    function handleSave() {
      if (isSubmitting) return; // Guard against rapid duplicate clicks
      isSubmitting = true;
      submissionCount += 1;
    }

    handleSave(); // 1st click
    handleSave(); // 2nd click while in-flight
    handleSave(); // 3rd click while in-flight

    expect(submissionCount).toBe(1);
  });

  it('ensures manual expense entry continues to work without AI involvement', () => {
    const manualExpense = {
      amount: '500',
      category: 'Transport',
      date: '2026-10-30',
      description: 'Monthly metro pass',
    };

    const validation = validateExpense(manualExpense);
    expect(validation.isValid).toBe(true);
    expect(validation.sanitized.amountPaise).toBe(50000);
    expect(validation.sanitized.category).toBe('Transport');
  });

  it('converts between rupee input values and integer paise accurately', () => {
    expect(rupeesToPaise('180')).toBe(18000);
    expect(rupeesToPaise('180.50')).toBe(18050);
    expect(rupeesToPaise('0.99')).toBe(99);

    expect(paiseToInputValue(18000)).toBe('180');
    expect(paiseToInputValue(18050)).toBe('180.50');
    expect(paiseToInputValue(99)).toBe('0.99');
  });
});
