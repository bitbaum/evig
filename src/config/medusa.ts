/**
 * Medusa configuration
 * 
 * Single Source of Truth for Medusa API configuration
 * Following dev guide: docs/development/DEV_GUIDE.md
 * URLs come from src/config/urls.ts (SSOT)
 */

import { MEDUSA_API_URL, MEDUSA_ADMIN_URL } from './urls'

export const MEDUSA_CONFIG = {
  URL: MEDUSA_API_URL,
  BACKEND_URL: MEDUSA_API_URL, // Alias for URL
  ADMIN_URL: MEDUSA_ADMIN_URL,
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
  ADMIN_API_KEY: process.env.MEDUSA_ADMIN_API_KEY || '',
  ADMIN_EMAIL: process.env.MEDUSA_ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.MEDUSA_ADMIN_PASSWORD || '',
} as const;

/**
 * Validates that required Medusa configuration is present
 * Throws error if critical config is missing
 */
export function validateMedusaConfig(): void {
  if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is required');
  }
}
