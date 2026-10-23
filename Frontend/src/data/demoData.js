import { getTodayDateString, getCurrentMonthKey, getPreviousMonthKey } from '../utils/dates';

/**
 * Generate sample demo transactions for user evaluation.
 * Never loaded automatically into empty storage; only loaded upon explicit user request.
 */
export function generateDemoData() {
  const today = getTodayDateString();
  const currentMonth = getCurrentMonthKey();
  const previousMonth = getPreviousMonthKey(currentMonth);

  const prevMonthDate = `${previousMonth}-15`;

  const expenses = [
    {
      id: 'demo-exp-1',
      amountPaise: 4500, // ₹45.00
      category: 'Food',
      date: today,
      description: 'Lunch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-exp-2',
      amountPaise: 3050, // ₹30.50
      category: 'Transport',
      date: today,
      description: 'Bus pass',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-exp-3',
      amountPaise: 25000, // ₹250.00
      category: 'Education',
      date: today,
      description: 'Notebook and study materials',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-exp-4',
      amountPaise: 180000, // ₹1,800.00
      category: 'Rent & Bills',
      date: today,
      description: 'Monthly electricity bill',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-exp-5',
      amountPaise: 89900, // ₹899.00
      category: 'Shopping',
      date: today,
      description: 'Running shoes',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-exp-6',
      amountPaise: 12000, // ₹120.00
      category: 'Food',
      date: prevMonthDate,
      description: 'Dinner with friends',
      createdAt: new Date(Date.now() - 2592000000).toISOString(),
      updatedAt: new Date(Date.now() - 2592000000).toISOString(),
      isDemo: true,
    },
  ];

  const budgets = {
    [currentMonth]: 750000, // ₹7,500.00
    [previousMonth]: 600000, // ₹6,000.00
  };

  return { expenses, budgets };
}
