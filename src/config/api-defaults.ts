/**
 * API Defaults Configuration
 *
 * SSOT for magic numbers and defaults used across API routes.
 * Import from here instead of hardcoding values.
 */

import { FILE_SIZE_LIMITS } from '@/config/limits'

export const API_DEFAULTS = {
  /** Default pagination limit for list endpoints */
  PAGINATION_LIMIT: 50,

  /** Maximum pagination limit allowed */
  PAGINATION_MAX_LIMIT: 200,

  /** Default offset for pagination */
  PAGINATION_OFFSET: 0,

  /** Default number of days for analytics queries */
  ANALYTICS_DAYS: 30,

  /** Maximum number of days for analytics queries */
  ANALYTICS_MAX_DAYS: 365,

  /** Default page size for admin tables */
  ADMIN_PAGE_SIZE: 25,

  /** Maximum items in a bulk operation */
  BULK_OPERATION_LIMIT: 100,

  /** Default chunk size for batch processing */
  BATCH_CHUNK_SIZE: 10,

  /** Maximum file upload size in bytes (10MB) — re-exported from limits.ts SSOT */
  MAX_UPLOAD_SIZE: FILE_SIZE_LIMITS.UPLOAD_MAX,

  /** Maximum number of images per product */
  MAX_IMAGES_PER_PRODUCT: 10,
} as const;

export type ApiDefault = typeof API_DEFAULTS[keyof typeof API_DEFAULTS];
