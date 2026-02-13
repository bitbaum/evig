/**
 * UI Typography Configuration
 *
 * SSOT for consistent text sizes and styles across all pages.
 * Mobile-first responsive typography.
 */

export const TYPOGRAPHY = {
  // Page titles
  pageTitle: 'text-2xl sm:text-3xl md:text-4xl font-bold',
  pageTitleSmall: 'text-xl sm:text-2xl md:text-3xl font-bold',

  // Section titles
  sectionTitle: 'text-xl sm:text-2xl md:text-3xl font-bold',
  sectionTitleSmall: 'text-lg sm:text-xl md:text-2xl font-bold',

  // Card titles
  cardTitle: 'text-base sm:text-lg md:text-xl font-semibold',
  cardTitleSmall: 'text-sm sm:text-base md:text-lg font-semibold',

  // Body text
  body: 'text-sm sm:text-base',
  bodyLarge: 'text-base sm:text-lg',
  bodySmall: 'text-xs sm:text-sm',

  // Lead/subtitle text
  lead: 'text-base sm:text-lg md:text-xl',
  subtitle: 'text-sm sm:text-base md:text-lg',

  // Labels
  label: 'text-sm font-medium',
  labelSmall: 'text-xs font-medium',

  // Buttons
  button: 'text-sm sm:text-base font-semibold',
  buttonLarge: 'text-base sm:text-lg font-semibold',
  buttonSmall: 'text-xs sm:text-sm font-semibold',
} as const
