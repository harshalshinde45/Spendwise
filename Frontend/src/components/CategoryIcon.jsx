import React from 'react';
import {
  Utensils,
  Bus,
  Home,
  ShoppingBag,
  GraduationCap,
  Film,
  HeartPulse,
  Sparkles,
  CircleEllipsis,
} from 'lucide-react';

const ICON_MAP = {
  Utensils,
  Bus,
  Home,
  ShoppingBag,
  GraduationCap,
  Film,
  HeartPulse,
  Sparkles,
  CircleEllipsis,
};

export function CategoryIcon({ iconName, size = 18, color, className = '' }) {
  const IconComponent = ICON_MAP[iconName] || CircleEllipsis;
  return <IconComponent size={size} color={color} className={className} aria-hidden="true" />;
}
