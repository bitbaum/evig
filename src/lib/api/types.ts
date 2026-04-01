/**
 * Shared API response types — SINGLE SOURCE OF TRUTH
 *
 * All API routes return { success, data?, error? }
 * These types mirror the server-side helpers in helpers.ts
 */

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/** Paginated API response (page-based) */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/** Paginated API response (offset-based) */
export interface OffsetPaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/** Paginated API response wrapped in ApiResponse */
export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>
