/**
 * UI Spacing Configuration
 *
 * SSOT for consistent spacing/padding across all community pages.
 * Based on Tailwind's spacing scale with responsive variants.
 */

export const SPACING = {
  // Hero sections
  hero: 'px-4 py-12 md:px-8 md:py-16 lg:py-20',
  heroGradient: 'px-4 py-12 md:px-8 md:py-16',

  // Page containers
  pageContainer: 'px-4 py-8 md:px-6 md:py-12',
  pageContainerNarrow: 'px-4 py-6 md:px-6 md:py-8',

  // Cards
  card: 'p-4 md:p-6',
  cardSmall: 'p-3 md:p-4',
  cardLarge: 'p-6 md:p-8',

  // Sections
  section: 'p-6 md:p-8',
  sectionSmall: 'p-4 md:p-6',

  // Gaps (for grid/flex)
  gap: 'gap-4 md:gap-6',
  gapSmall: 'gap-2 md:gap-3',
  gapLarge: 'gap-6 md:gap-8',

  // Margins
  mb: 'mb-4 md:mb-6',
  mbSmall: 'mb-2 md:mb-3',
  mbMedium: 'mb-4 md:mb-6',
  mbLarge: 'mb-6 md:mb-8',
} as const
