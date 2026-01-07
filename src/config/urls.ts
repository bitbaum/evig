/**
 * URL Configuration - Single Source of Truth
 * 
 * All application URLs should be defined here.
 * Following dev guide: docs/development/DEV_GUIDE.md - SSOT principle
 */

/**
 * Application base URL
 * Used for email verification links, password reset links, etc.
 */
export const APP_URL = 
  process.env.NEXTAUTH_URL || 
  process.env.NEXT_PUBLIC_APP_URL || 
  'http://localhost:3000'

/**
 * Medusa Admin URL
 * Used for admin shortcuts and Medusa integration
 */
export const MEDUSA_ADMIN_URL = 
  process.env.MEDUSA_ADMIN_URL || 
  process.env.MEDUSA_BACKEND_URL ? `${process.env.MEDUSA_BACKEND_URL}/app` : 
  'http://localhost:9000/app'

/**
 * Medusa Backend API URL
 * Used for API calls to Medusa
 */
export const MEDUSA_API_URL = 
  process.env.MEDUSA_BACKEND_URL || 
  'http://localhost:9000'

/**
 * CMS API URL
 * Used for CMS API integration
 */
export const CMS_API_URL = 
  process.env.NEXT_PUBLIC_REBOOT_CONTENT_URL || 
  process.env.CMS_API_URL || 
  'http://localhost:3001'

/**
 * URL Configuration Object
 * Export all URLs in one place for easy access
 */
export const URLS = {
  APP: APP_URL,
  MEDUSA_ADMIN: MEDUSA_ADMIN_URL,
  MEDUSA_API: MEDUSA_API_URL,
  CMS_API: CMS_API_URL,
} as const

/**
 * Helper function to build verification URLs
 */
export function getVerificationUrl(token: string): string {
  return `${APP_URL}/auth/verify-email?token=${token}`
}

/**
 * Helper function to build password reset URLs
 */
export function getPasswordResetUrl(token: string): string {
  return `${APP_URL}/auth/reset-password?token=${token}`
}
