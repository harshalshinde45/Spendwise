import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PageHeader } from '../components/PageHeader';
import { formatINR, rupeesToPaise, paiseToRupees } from '../utils/currency';
import { formatDateReadable } from '../utils/dates';
import {
  Target,
  Plus,
  Sparkles,
  Trophy,
  Calendar,
  PiggyBank,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Heart,
} from 'lucide-react';
import './SavingsGoalsPage.css';

export function SavingsGoalsPage() {
  const { goals = [], addGoal, updateGoal, deleteGoal, contributeToGoal, openConfirmDialog } = useExpense();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [activeGoalForContribution, setActiveGoalForContribution] = useState(null);

  // Form states
  const [goalName, setGoalName] = useState('');
  const [targetRupees, setTargetRupees] = useState('');
  const [savedRupees, setSavedRupees] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [category, setCategory] = useState('Personal');

  // Contribution input
  const [contributionRupees, setContributionRupees] = useState('');

  const openCreateModal = () => {
    setEditingGoal(null);
    setGoalName('');
    setTargetRupees('');
    setSavedRupees('0');
    setTargetDate('');
    setPersonalMessage('');
    setCategory('Personal');
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name || '');
    setTargetRupees(paiseToRupees(goal.targetPaise).toString());
    setSavedRupees(paiseToRupees(goal.savedPaise || 0).toString());
    setTargetDate(goal.targetDate || '');
    setPersonalMessage(goal.personalMessage || '');
    setCategory(goal.category || 'Personal');
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalName.trim() || !targetRupees) return;

    const targetPaise = rupeesToPaise(targetRupees);
    const initialSavedPaise = rupeesToPaise(savedRupees) || 0;

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        name: goalName.trim(),
        targetPaise,
        savedPaise: initialSavedPaise,
        targetDate,
        personalMessage: personalMessage.trim(),
        category,
      });
    } else {
      await addGoal({
        name: goalName.trim(),
        targetPaise,
        savedPaise: initialSavedPaise,
        targetDate,
        personalMessage: personalMessage.trim(),
        category,
      });
    }

    setIsModalOpen(false);
  };

  const openContribution = (goal) => {
    setActiveGoalForContribution(goal);
    setContributionRupees('');
    setIsContributeModalOpen(true);
  };

  const handleSaveContribution = async (e) => {
    e.preventDefault();
    if (!activeGoalForContribution || !contributionRupees) return;

    const amountPaise = rupeesToPaise(contributionRupees);
    if (amountPaise <= 0) return;

    await contributeToGoal(activeGoalForContribution.id, amountPaise);
    setIsContributeModalOpen(false);
  };

  const handleDelete = (goal) => {
    openConfirmDialog({
      title: 'Delete Savings Goal?',
      message: `Are you sure you want to delete "${goal.name}"? This tracking record will be removed from your database.`,
      confirmLabel: 'Delete Goal',
      isDanger: true,
      onConfirm: () => deleteGoal(goal.id),
    });
  };

  return (
    <div className="savings-goals-page">
      <div className="goals-page-header-row">
        <PageHeader
          title="Savings Goals & Milestones"
          subtitle="Track user-defined financial ambitions and receive future-self reminders at key milestones"
          showMonthSelector={false}
          showAddExpense={false}
        />
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Disclaimed note */}
      <div className="goals-disclaimer">
        <PiggyBank size={16} aria-hidden="true" />
        <span>
          Note: Savings goals are intentional tracking targets recorded in your database. No actual bank transfers or account deposits occur.
        </span>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="card goals-empty-card">
          <div className="goals-empty-icon">
            <Target size={36} />
          </div>
          <h3>No Savings Goals Configured</h3>
          <p>
            Whether it's an emergency fund, travel fund, or down payment, setting a goal keeps your financial priorities clear.
          </p>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="goals-cards-grid">
          {goals.map((goal) => {
            const target = goal.targetPaise || 1;
            const saved = goal.savedPaise || 0;
            const progressPercent = Math.min(100, Math.round((saved / target) * 100));
            const isCompleted = saved >= target;
            const hasMilestone = progressPercent >= 25 && goal.personalMessage;

            return (
              <div key={goal.id} className={`card goal-card ${isCompleted ? 'goal-completed' : ''}`}>
                <div className="goal-card-header">
                  <div className="goal-title-group">
                    <span className="goal-category-tag">{goal.category || 'General'}</span>
                    <h3 className="goal-name">{goal.name}</h3>
                  </div>

                  <div className="goal-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => openEditModal(goal)}
                      title="Edit Goal"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon text-danger"
                      onClick={() => handleDelete(goal)}
                      title="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="goal-progress-section">
                  <div className="goal-amounts-row font-mono">
                    <span className="saved-amount">{formatINR(saved)}</span>
                    <span className="target-amount">of {formatINR(target)}</span>
                  </div>

                  <div className="goal-progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={`goal-progress-fill ${isCompleted ? 'fill-completed' : ''}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="goal-progress-labels">
                    <span className="percent-label font-mono font-bold">
                      {progressPercent}% Complete
                    </span>
                    {goal.targetDate && (
                      <span className="date-label">
                        Target: {formatDateReadable(goal.targetDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Future-Self Message Milestone Box */}
                {goal.personalMessage && (
                  <div className={`future-self-box ${hasMilestone ? 'milestone-unlocked' : 'milestone-pending'}`}>
                    <div className="future-self-header">
                      {hasMilestone ? (
                        <>
                          <Sparkles size={14} className="sparkle-icon" />
                          <span>Future-Self Message • {progressPercent}% Milestone</span>
                        </>
                      ) : (
                        <>
                          <Heart size={14} className="heart-icon" />
                          <span>Why this goal matters</span>
                        </>
                      )}
                    </div>
                    <p className="future-self-text">"{goal.personalMessage}"</p>
                  </div>
                )}

                {/* Quick Contribute Button */}
                <div className="goal-card-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm contribute-btn"
                    onClick={() => openContribution(goal)}
                  >
                    <Plus size={14} />
                    <span>Record Savings Contribution</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Creation / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
          <div className="modal-dialog card">
            <div className="modal-header">
              <h3 id="goal-modal-title" className="modal-title">
                {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="goal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="goal-name-input">
                  Goal Name *
                </label>
                <input
                  id="goal-name-input"
                  type="text"
                  required
                  maxLength={60}
                  className="form-input"
                  placeholder="e.g. Emergency Rainy Day Fund, Trip to Kyoto"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-target-input">
                    Target Amount *
                  </label>
                  <div className="amount-input-wrapper">
                    <span className="currency-prefix" aria-hidden="true">₹</span>
                    <input
                      id="goal-target-input"
                      type="number"
                      min="1"
                      step="any"
                      required
                      className="form-input amount-input font-mono"
                      placeholder="50000"
                      value={targetRupees}
                      onChange={(e) => setTargetRupees(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="goal-saved-input">
                    Current Amount Saved
                  </label>
                  <div className="amount-input-wrapper">
                    <span className="currency-prefix" aria-hidden="true">₹</span>
                    <input
                      id="goal-saved-input"
                      type="number"
                      min="0"
                      step="any"
                      className="form-input amount-input font-mono"
                      placeholder="0"
                      value={savedRupees}
                      onChange={(e) => setSavedRupees(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-date-input">
                    Target Completion Date (Optional)
                  </label>
                  <input
                    id="goal-date-input"
                    type="date"
                    className="form-input font-mono"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="goal-cat-input">
                    Category Tag
                  </label>
                  <input
                    id="goal-cat-input"
                    type="text"
                    maxLength={30}
                    className="form-input"
                    placeholder="e.g. Travel, Safety, Education"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="goal-msg-input">
                  Future-Self Motivational Message (Optional)
                </label>
                <textarea
                  id="goal-msg-input"
                  rows={3}
                  maxLength={240}
                  className="form-input"
                  placeholder="Write a reminder to your future self for why this goal matters (revealed at progress milestones)..."
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Contribution Modal */}
      {isContributeModalOpen && activeGoalForContribution && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="contrib-title">
          <div className="modal-dialog card modal-sm">
            <div className="modal-header">
              <h3 id="contrib-title" className="modal-title">
                Add to "{activeGoalForContribution.name}"
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsContributeModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="goal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="contrib-amount">
                  Contribution Amount *
                </label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix" aria-hidden="true">₹</span>
                  <input
                    id="contrib-amount"
                    type="number"
                    min="1"
                    step="any"
                    required
                    autoFocus
                    className="form-input amount-input font-mono font-bold"
                    placeholder="1000"
                    value={contributionRupees}
                    onChange={(e) => setContributionRupees(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsContributeModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
