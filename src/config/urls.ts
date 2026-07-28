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
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'

/**
 * Public, canonical origin — where the app is reachable from the internet.
 * DISTINCT from APP_URL: never falls back to NEXTAUTH_URL, which on the box is
 * the internal bind port (localhost:4004). Used as Next's `metadataBase` so
 * og:image / canonical metadata resolve to real absolute URLs a social scraper
 * can fetch — not localhost. Override with NEXT_PUBLIC_SITE_URL; prod sets it to
 * the live host. `revampit.orangecat.ch` remains a working alias.
 */
export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://evig.orangecat.ch'

/**
 * Meilisearch URL
 * Used for full-text search on listings
 */
export const MEILISEARCH_URL =
  process.env.MEILISEARCH_HOST ||
  'http://localhost:7700'

/**
 * Ollama URL
 * Used for local AI inference (chat + embeddings)
 */
export const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  process.env.OLLAMA_BASE_URL ||
  'http://localhost:11434'

/**
 * URL Configuration Object
 * Export all URLs in one place for easy access
 */
export const URLS = {
  APP: APP_URL,
  MEILISEARCH: MEILISEARCH_URL,
  OLLAMA: OLLAMA_URL,
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
