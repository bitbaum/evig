import { pgTable, uuid, text, varchar, integer, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { users } from './auth'

export const referralCodes = pgTable('referral_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  code: varchar('code', { length: 16 }).notNull().unique(),
  uses: integer('uses').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  index('idx_referral_codes_user').on(t.userId),
])

export const referralInvitations = pgTable('referral_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  referralCodeId: uuid('referral_code_id').notNull().references(() => referralCodes.id, { onDelete: 'cascade' }),
  invitedEmail: text('invited_email').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  registeredAt: timestamp('registered_at', { withTimezone: true, mode: 'string' }),
  rewardedAt: timestamp('rewarded_at', { withTimezone: true, mode: 'string' }),
}, (t) => [
  index('idx_referral_invitations_code').on(t.referralCodeId),
  unique('referral_invitations_unique').on(t.referralCodeId, t.invitedEmail),
])

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 32 }).notNull().unique(),
  amountCents: integer('amount_cents').notNull(),
  source: varchar('source', { length: 32 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  index('idx_coupons_user').on(t.userId),
  index('idx_coupons_code').on(t.code),
])

export type ReferralCode = typeof referralCodes.$inferSelect
export type ReferralInvitation = typeof referralInvitations.$inferSelect
export type Coupon = typeof coupons.$inferSelect
