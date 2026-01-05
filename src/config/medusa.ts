/**
 * Medusa configuration
 * 
 * Single Source of Truth for Medusa API configuration
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

export const MEDUSA_CONFIG = {
  URL: process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
  ADMIN_API_KEY: process.env.MEDUSA_ADMIN_API_KEY || '',
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
