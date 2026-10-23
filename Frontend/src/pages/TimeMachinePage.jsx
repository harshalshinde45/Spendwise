import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { FinancialTimeMachine } from '../components/FinancialTimeMachine';
import { SurvivalBudgetMode } from '../components/SurvivalBudgetMode';
import { Sparkles, HeartHandshake } from 'lucide-react';
import './TimeMachinePage.css';

export function TimeMachinePage() {
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'survival'

  return (
    <div className="time-machine-page">
      <PageHeader
        title="Time Machine & Planning Sandbox"
        subtitle="Test hypothetical purchase decisions and simulate essential survival budgets without altering your records"
        showMonthSelector={true}
      />

      {/* Segmented Mode Selector */}
      <div className="sandbox-tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'simulator'}
          className={`sandbox-tab ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Sparkles size={16} />
          <span>Purchase Simulator</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'survival'}
          className={`sandbox-tab ${activeTab === 'survival' ? 'active' : ''}`}
          onClick={() => setActiveTab('survival')}
        >
          <HeartHandshake size={16} />
          <span>Survival Budget Planner</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="sandbox-content-panel">
        {activeTab === 'simulator' ? <FinancialTimeMachine /> : <SurvivalBudgetMode />}
      </div>
    </div>
  );
}
