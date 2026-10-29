/**
 * Categories defined for SpendWise.
 * Colors and icons use a modern, accessible, high-contrast fintech palette.
 */
export const CATEGORIES = [
  {
    id: 'food',
    name: 'Food',
    iconName: 'Utensils',
    color: '#FF6B2C', // Signature Vibrant Orange
    bgColor: '#FFF2EC',
    examples: 'Groceries, dining out, snacks, coffee'
  },
  {
    id: 'transport',
    name: 'Transport',
    iconName: 'Bus',
    color: '#2563EB', // Cobalt Blue
    bgColor: '#EFF6FF',
    examples: 'Public transit, fuel, rideshare, parking'
  },
  {
    id: 'rent-bills',
    name: 'Rent & Bills',
    iconName: 'Home',
    color: '#7C3AED', // Violet
    bgColor: '#F5F3FF',
    examples: 'Rent, electricity, water, internet, recharge'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    iconName: 'ShoppingBag',
    color: '#EC4899', // Berry Pink
    bgColor: '#FDF2F8',
    examples: 'Clothing, gadgets, household essentials'
  },
  {
    id: 'education',
    name: 'Education',
    iconName: 'GraduationCap',
    color: '#0EA5E9', // Sky Blue
    bgColor: '#F0F9FF',
    examples: 'Books, courses, tuition, stationary'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    iconName: 'Film',
    color: '#F59E0B', // Amber
    bgColor: '#FFFBEB',
    examples: 'Movies, games, streaming services, events'
  },
  {
    id: 'health',
    name: 'Health',
    iconName: 'HeartPulse',
    color: '#10B981', // Emerald
    bgColor: '#ECFDF5',
    examples: 'Medicines, doctor visits, wellness, gym'
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    iconName: 'Sparkles',
    color: '#14B8A6', // Teal
    bgColor: '#F0FDFA',
    examples: 'Haircuts, grooming, personal care products'
  },
  {
    id: 'other',
    name: 'Other',
    iconName: 'CircleEllipsis',
    color: '#64748B', // Slate Grey
    bgColor: '#F8FAFC',
    examples: 'Miscellaneous and unexpected expenses'
  }
];

export const CATEGORY_NAMES = CATEGORIES.map(c => c.name);

export function getCategoryByName(name) {
  return CATEGORIES.find(c => c.name.toLowerCase() === (name || '').toLowerCase()) || {
    id: 'other',
    name: name || 'Other',
    iconName: 'CircleEllipsis',
    color: '#64748B',
    bgColor: '#F8FAFC',
    examples: 'General expense'
  };
}
