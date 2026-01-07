/**
 * CMS (Reboot Content) configuration
 * 
 * Single Source of Truth for CMS API configuration
 * Following dev guide: docs/development/DEV_GUIDE.md
 * URLs come from src/config/urls.ts (SSOT)
 */

import { CMS_API_URL } from './urls'

export const CMS_CONFIG = {
  URL: CMS_API_URL,
  ENABLED: process.env.ENABLE_CMS === 'true',
  TOKEN: process.env.REBOOT_CONTENT_TOKEN || '',
} as const;

/**
 * Validates that CMS configuration is present when CMS is enabled
 */
export function validateCmsConfig(): void {
  if (CMS_CONFIG.ENABLED && !CMS_CONFIG.URL) {
    throw new Error('NEXT_PUBLIC_REBOOT_CONTENT_URL is required when ENABLE_CMS is true');
  }
}
