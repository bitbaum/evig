/**
 * Newsletter Subscription Status Configuration
 *
 * SSOT for newsletter subscriber lifecycle statuses.
 * Used by: newsletter subscribe/confirm API routes
 */

export const NEWSLETTER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  UNSUBSCRIBED: 'unsubscribed',
} as const

export type NewsletterStatus = typeof NEWSLETTER_STATUS[keyof typeof NEWSLETTER_STATUS]
