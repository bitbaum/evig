/**
 * Centralized Responsive Design System
 * 
 * This module provides consistent responsive utilities and components
 * to ensure maintainable, mobile-first styling across all pages.
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Created centralized responsive design system
 */

import { cn } from './utils'

/**
 * Responsive Typography Classes
 * Provides consistent heading and text sizes across breakpoints
 */
export const responsiveTypography = {
  // Hero headings (h1)
  hero: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
  
  // Section headings (h2)
  section: 'text-2xl sm:text-3xl md:text-4xl',
  
  // Subsection headings (h3)
  subsection: 'text-xl sm:text-2xl',
  
  // Card titles
  cardTitle: 'text-lg sm:text-xl md:text-2xl',
  
  // Body text
  body: 'text-sm sm:text-base',
  bodyLarge: 'text-base sm:text-lg md:text-xl',
  
  // Small text
  small: 'text-xs sm:text-sm',
  
  // Lead text (intro paragraphs)
  lead: 'text-base sm:text-lg md:text-xl',
}

/**
 * Responsive Spacing Classes
 * Provides consistent padding and margins across breakpoints
 */
export const responsiveSpacing = {
  // Section vertical padding
  section: 'py-12 sm:py-16 md:py-20',
  sectionLarge: 'py-12 sm:py-16 md:py-20 lg:py-24',
  
  // Container horizontal padding
  container: 'px-4 sm:px-6',
  containerLarge: 'px-4 sm:px-6 md:px-8',
  
  // Gap between elements
  gap: 'gap-4 sm:gap-6 md:gap-8',
  gapSmall: 'gap-2 sm:gap-3 md:gap-4',
  gapLarge: 'gap-6 sm:gap-8 md:gap-12',
  
  // Margin bottom
  mb: 'mb-4 sm:mb-6 md:mb-8',
  mbSmall: 'mb-2 sm:mb-3 md:mb-4',
  mbLarge: 'mb-8 sm:mb-12 md:mb-16',
}

/**
 * Responsive Button Classes
 * Consistent button sizing across breakpoints
 */
export const responsiveButtons = {
  // Primary button
  primary: 'px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg',
  
  // Secondary button
  secondary: 'px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 text-sm sm:text-base',
  
  // Small button
  small: 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm',
}

/**
 * Responsive Grid Classes
 * Consistent grid layouts across breakpoints
 */
export const responsiveGrid = {
  // 1 column mobile, 2 columns tablet, 3 columns desktop
  cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  
  // 1 column mobile, 2 columns desktop
  twoColumn: 'grid grid-cols-1 md:grid-cols-2',
  
  // 1 column mobile, 2 columns tablet, 4 columns desktop
  fourColumn: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

/**
 * Helper function to combine responsive classes
 */
export function r(...classes: (string | undefined | null | false)[]): string {
  return cn(...classes.filter(Boolean))
}
