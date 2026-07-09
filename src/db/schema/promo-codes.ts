import { pgTable, uuid, varchar, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth'

/**
 * Admin-issued discount + gift-card codes, redeemable at checkout. Distinct from
 * the referral `coupons` table (per-user auto-issued rewards). type/scope are
 * app-level enums (src/config/promo-codes.ts), not DB CHECK lists.
 */
export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(),               // percent | fixed | gift_card
  percent: integer('percent'),                                    // type=percent: 1..100
  amountCents: integer('amount_cents'),                           // type=fixed/gift_card: value
  balanceCents: integer('balance_cents'),                         // gift_card: remaining balance
  scope: varchar('scope', { length: 20 }).notNull().default('all'),
  minOrderCents: integer('min_order_cents').notNull().default(0),
  maxRedemptions: integer('max_redemptions'),                     // null = unlimited
  perUserLimit: integer('per_user_limit'),                        // null = unlimited
  redeemedCount: integer('redeemed_count').notNull().default(0),
  validFrom: timestamp('valid_from', { withTimezone: true, mode: 'string' }),
  validUntil: timestamp('valid_until', { withTimezone: true, mode: 'string' }),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  index('idx_promo_codes_code').on(t.code),
])

export const promoCodeRedemptions = pgTable('promo_code_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promoCodeId: uuid('promo_code_id').notNull().references(() => promoCodes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  orderRef: varchar('order_ref', { length: 128 }),
  scope: varchar('scope', { length: 20 }).notNull(),
  amountDiscountedCents: integer('amount_discounted_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  index('idx_promo_redemptions_code').on(t.promoCodeId),
  index('idx_promo_redemptions_user').on(t.userId),
])

export type PromoCode = typeof promoCodes.$inferSelect
export type PromoCodeRedemption = typeof promoCodeRedemptions.$inferSelect
