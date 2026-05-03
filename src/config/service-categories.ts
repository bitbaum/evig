/**
 * Service Categories Styling Configuration
 *
 * Visual styling for service categories.
 * Non-editable by admins to maintain visual consistency.
 */

import type { ServiceCategory } from '@/config/database'

/**
 * Category style configuration
 */
export interface CategoryStyle {
  /** Primary color for accents and buttons */
  primary: string
  /** Light background color */
  bgLight: string
  /** Dark background for dark mode */
  bgDark: string
  /** Text color on primary background */
  textOnPrimary: string
  /** Gradient for hero sections */
  gradient: string
  /** Badge/tag colors */
  badge: {
    bg: string
    text: string
    bgDark: string
    textDark: string
  }
}

/**
 * Category styles - visual appearance per category
 * Used for consistent styling across public pages
 */
export const CATEGORY_STYLES: Record<ServiceCategory, CategoryStyle> = {
  repair: {
    primary: 'info-600',
    bgLight: 'info-50',
    bgDark: 'info-900/20',
    textOnPrimary: 'white',
    gradient: 'from-info-600 to-info-800',
    badge: {
      bg: 'bg-info-100',
      text: 'text-info-800',
      bgDark: 'dark:bg-info-900/30',
      textDark: 'dark:text-info-300',
    },
  },
  data: {
    primary: 'primary-600',
    bgLight: 'primary-50',
    bgDark: 'primary-900/20',
    textOnPrimary: 'white',
    gradient: 'from-primary-600 to-primary-800',
    badge: {
      bg: 'bg-primary-100',
      text: 'text-primary-800',
      bgDark: 'dark:bg-primary-900/30',
      textDark: 'dark:text-primary-300',
    },
  },
  recycling: {
    primary: 'emerald-600',
    bgLight: 'emerald-50',
    bgDark: 'emerald-900/20',
    textOnPrimary: 'white',
    gradient: 'from-emerald-600 to-emerald-800',
    badge: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      bgDark: 'dark:bg-emerald-900/30',
      textDark: 'dark:text-emerald-300',
    },
  },
  software: {
    primary: 'purple-600',
    bgLight: 'purple-50',
    bgDark: 'purple-900/20',
    textOnPrimary: 'white',
    gradient: 'from-purple-600 to-purple-800',
    badge: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      bgDark: 'dark:bg-purple-900/30',
      textDark: 'dark:text-purple-300',
    },
  },
  web: {
    primary: 'orange-600',
    bgLight: 'orange-50',
    bgDark: 'orange-900/20',
    textOnPrimary: 'white',
    gradient: 'from-orange-600 to-orange-800',
    badge: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      bgDark: 'dark:bg-orange-900/30',
      textDark: 'dark:text-orange-300',
    },
  },
  general: {
    primary: 'neutral-600',
    bgLight: 'neutral-50',
    bgDark: 'neutral-900/20',
    textOnPrimary: 'white',
    gradient: 'from-neutral-600 to-neutral-800',
    badge: {
      bg: 'bg-neutral-100',
      text: 'text-neutral-800',
      bgDark: 'dark:bg-neutral-800/50',
      textDark: 'dark:text-neutral-300',
    },
  },
}

/**
 * Get category style
 * Returns general style as fallback
 */
export function getCategoryStyle(category: string | null): CategoryStyle {
  if (!category) return CATEGORY_STYLES.general
  return CATEGORY_STYLES[category as ServiceCategory] ?? CATEGORY_STYLES.general
}

/**
 * Get badge class names for a category
 */
export function getCategoryBadgeClasses(category: string | null): string {
  const style = getCategoryStyle(category)
  return `${style.badge.bg} ${style.badge.text} ${style.badge.bgDark} ${style.badge.textDark}`
}

/**
 * Category labels in German
 */
export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  repair: 'Reparatur',
  data: 'Daten',
  recycling: 'Recycling',
  software: 'Software',
  web: 'Web',
  general: 'Allgemein',
}

/**
 * Get category label
 */
export function getCategoryLabel(category: string | null): string {
  if (!category) return 'Allgemein'
  return CATEGORY_LABELS[category as ServiceCategory] ?? category
}
