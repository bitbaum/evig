/**
 * Pagination constants — SSOT for all page sizes across the application.
 * Use these instead of hardcoded numbers to ensure consistent UX.
 */
export const PAGINATION = {
  /** General-purpose admin list views */
  DEFAULT: 25,
  /** User-facing lists (marketplace, listings, blog) */
  PUBLIC: 20,
  /** Dense admin tables with lots of columns */
  DENSE: 50,
  /** Quick-select dropdowns and type-ahead searches */
  SEARCH: 10,
  /** Small widgets (recent items, sidebars) */
  WIDGET: 5,
  /** Notification / activity feeds */
  FEED: 20,
  /** Intake / inventory pipeline */
  INTAKE: 20,
} as const

export type PaginationKey = keyof typeof PAGINATION
