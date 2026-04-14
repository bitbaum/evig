import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// NEWSLETTER SUBSCRIPTIONS
// =============================================================================
// Final state: original 001 + confirm_token from 042.

export const newsletterSubscriptions = pgTable('newsletter_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Preferences
  frequency: text('frequency').default('monthly'),
  topics: text('topics').array(),
  language: text('language').default('de'),

  // Status
  isActive: boolean('is_active').default(true),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true, mode: 'string' }),

  // Tracking
  source: text('source'),

  // Email confirmation token (added by 042)
  confirmToken: text('confirm_token'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_newsletter_subscriptions_email').on(table.email),
  index('idx_newsletter_subscriptions_confirm_token').on(table.confirmToken),
])

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect
export type NewNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert
