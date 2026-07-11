import { pgTable, uuid, text, boolean, timestamp, integer, varchar, jsonb, index, uniqueIndex, primaryKey, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// =============================================================================
// USERS
// =============================================================================
// Central identity table (Auth.js compatible with camelCase column names).
// Email column is CITEXT in PostgreSQL (case-insensitive); Drizzle uses text().

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { withTimezone: true, mode: 'string' }),
  passwordHash: text('password_hash'),
  image: text('image'),
  // Legacy role column kept for backward compatibility
  role: text('role').default('user'),
  // Simplified auth (002)
  isStaff: boolean('is_staff').default(false),
  staffPermissions: text('staff_permissions').array().default([]),
  // Super admin management (004)
  isSuperAdmin: boolean('is_super_admin').default(false),
  // JWT staleness counter (072). Bumped by admin permission-change routes
  // to force the Auth.js jwt callback to re-fetch staff_permissions /
  // is_staff / is_super_admin from the DB on the user's next token
  // refresh (~24h via Auth.js updateAge). Without this, a demoted admin
  // retained their old token's permissions until the 30-day maxAge
  // expired or they manually re-logged-in.
  tokenVersion: integer('token_version').notNull().default(0),
  // Dashboard layout preference (Phase 6)
  dashboardMode: text('dashboard_mode').notNull().default('coordinator'),
  // Verein membership (062)
  isMember: boolean('is_member').default(false),
  memberSince: timestamp('member_since', { withTimezone: true, mode: 'string' }),
  memberType: text('member_type').default('regular'),
  memberPaidUntil: timestamp('member_paid_until', { withTimezone: true, mode: 'string' }),
  // Timestamps (camelCase for Auth.js adapter)
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_is_staff').on(table.isStaff),
  index('idx_users_staff_permissions').using('gin', table.staffPermissions),
  index('idx_users_is_super_admin').on(table.isSuperAdmin),
  // 055: admin user listing sorted by join date
  index('idx_users_staff_created').on(table.isStaff, table.createdAt),
  // Mirrors the CHECK added by migration 079 (users_token_version_non_negative).
  // Belt-and-suspenders: the column is NOT NULL DEFAULT 0 and bumped on
  // permission changes; a regression that decremented past 0 would silently
  // lock all users with that token version into a permanent stale-token state.
  check('users_token_version_non_negative', sql`${table.tokenVersion} >= 0`),
])

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// =============================================================================
// SESSIONS (Auth.js managed)
// =============================================================================

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
  index('idx_sessions_user_id').on(table.userId),
])

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

// =============================================================================
// ACCOUNTS (OAuth provider accounts, Auth.js managed)
// =============================================================================

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
}, (table) => [
  index('idx_accounts_user_id').on(table.userId),
  uniqueIndex('accounts_provider_provider_account_id_unique').on(table.provider, table.providerAccountId),
])

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

// =============================================================================
// VERIFICATION TOKENS (email verification, password reset)
// =============================================================================

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.identifier, table.token] }),
])

export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert

// =============================================================================
// USER PROFILES (extended user data)
// =============================================================================
// Final state includes columns from 001 + 033 (avatar, display name, settings).

export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),

  // Personal info
  firstName: text('first_name'),
  lastName: text('last_name'),
  companyName: text('company_name'),

  // Contact
  phone: text('phone'),
  mobile: text('mobile'),

  // Address (Swiss format)
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  postalCode: text('postal_code'),
  city: text('city'),
  canton: text('canton'),
  country: text('country').default('Schweiz'),

  // Preferences
  interests: text('interests').array(),
  preferredLanguage: text('preferred_language').default('de'),
  newsletterSubscribed: boolean('newsletter_subscribed').default(false),
  newsletterFrequency: text('newsletter_frequency').default('monthly'),

  // Supporter info
  isSupporter: boolean('is_supporter').default(false),
  supporterSince: timestamp('supporter_since', { withTimezone: true, mode: 'string' }),
  supporterType: text('supporter_type'),

  // Notes
  notes: text('notes'),

  // Public profile fields (033)
  avatarUrl: text('avatar_url'),
  displayName: text('display_name'),
  bio: text('bio'),
  // CHECK (profile_visibility IN ('public', 'private')) — validated at app layer
  profileVisibility: text('profile_visibility').default('public'),

  // Per-PERSON verification (SSOT, migration 121). Verified once, surfaced in
  // whatever role the person acts (seller badge, technician badge). Replaces the
  // per-role is_verified on seller_profiles/technician_profiles.
  isVerified: boolean('is_verified').notNull().default(false),
  verificationDate: timestamp('verification_date', { withTimezone: true, mode: 'string' }),

  // Privacy toggles (033)
  showEmail: boolean('show_email').default(false),
  showPhone: boolean('show_phone').default(false),

  // Notification preferences (033)
  emailNotifications: boolean('email_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(false),
  marketplaceUpdates: boolean('marketplace_updates').default(true),
  workshopReminders: boolean('workshop_reminders').default(true),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_user_profiles_user_id').on(table.userId),
  index('idx_user_profiles_avatar_url').on(table.avatarUrl),
  index('idx_user_profiles_display_name').on(table.displayName),
])

export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert

// =============================================================================
// USER LOCKOUTS (account lockout tracking)
// =============================================================================

export const userLockouts = pgTable('user_lockouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: varchar('ip_address', { length: 45 }),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockoutCount: integer('lockout_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true, mode: 'string' }),
  lastAttempt: timestamp('last_attempt', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_lockouts_user_id').on(table.userId),
  index('idx_lockouts_locked_until').on(table.lockedUntil),
])

export type UserLockout = typeof userLockouts.$inferSelect
export type NewUserLockout = typeof userLockouts.$inferInsert

// =============================================================================
// AUTH AUDIT LOG (security event logging)
// =============================================================================

export const authAuditLog = pgTable('auth_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent'),
  details: jsonb('details').default({}),
  // CHECK (severity IN ('info', 'warning', 'critical')) — validated at app layer
  severity: varchar('severity', { length: 20 }).notNull().default('info'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_audit_log_user_id').on(table.userId),
  index('idx_audit_log_event_type').on(table.eventType),
  index('idx_audit_log_created_at').on(table.createdAt),
  index('idx_audit_log_ip_address').on(table.ipAddress),
  index('idx_audit_log_severity').on(table.severity),
  index('idx_audit_log_user_event').on(table.userId, table.eventType, table.createdAt),
])

export type AuthAuditLogEntry = typeof authAuditLog.$inferSelect
export type NewAuthAuditLogEntry = typeof authAuditLog.$inferInsert
