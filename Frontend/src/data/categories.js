/**
 * Default categories as defined in the SpendWise SRS.
 * Colors and icons use a calm, accessible palette.
 */
export const CATEGORIES = [
  {
    id: 'food',
    name: 'Food',
    iconName: 'Utensils',
    color: '#3E6B50', // Forest Green
    bgColor: '#E8F0E8',
    examples: 'Groceries, dining out, snacks, coffee'
  },
  {
    id: 'transport',
    name: 'Transport',
    iconName: 'Bus',
    color: '#8A5D3B', // Terracotta Brown
    bgColor: '#F5ECE5',
    examples: 'Public transit, fuel, rideshare, parking'
  },
  {
    id: 'rent-bills',
    name: 'Rent & Bills',
    iconName: 'Home',
    color: '#4B6375', // Warm Slate Blue
    bgColor: '#E8EEF3',
    examples: 'Rent, electricity, water, internet, recharge'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    iconName: 'ShoppingBag',
    color: '#A6533A', // Warm Brick
    bgColor: '#F8ECE8',
    examples: 'Clothing, gadgets, household essentials'
  },
  {
    id: 'education',
    name: 'Education',
    iconName: 'GraduationCap',
    color: '#5C5470', // Muted Deep Iris
    bgColor: '#ECEAF2',
    examples: 'Books, courses, tuition, stationary'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    iconName: 'Film',
    color: '#82633F', // Muted Ochre
    bgColor: '#F6EFE6',
    examples: 'Movies, games, streaming services, events'
  },
  {
    id: 'health',
    name: 'Health',
    iconName: 'HeartPulse',
    color: '#9C3D49', // Muted Crimson
    bgColor: '#F7EBED',
    examples: 'Medicines, doctor visits, wellness, gym'
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    iconName: 'Sparkles',
    color: '#547268', // Muted Sage
    bgColor: '#EAF1EE',
    examples: 'Haircuts, grooming, personal care products'
  },
  {
    id: 'other',
    name: 'Other',
    iconName: 'CircleEllipsis',
    color: '#656D60', // Neutral Charcoal Sage
    bgColor: '#EFF0ED',
    examples: 'Miscellaneous and unexpected expenses'
  }
];

export const CATEGORY_NAMES = CATEGORIES.map(c => c.name);

export function getCategoryByName(name) {
  return CATEGORIES.find(c => c.name.toLowerCase() === (name || '').toLowerCase()) || {
    id: 'other',
    name: name || 'Other',
    iconName: 'CircleEllipsis',
    color: '#656D60',
    bgColor: '#EFF0ED',
    examples: 'General expense'
  };
}
