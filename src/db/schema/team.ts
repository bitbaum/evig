import { pgTable, uuid, text, boolean, timestamp, integer, date, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'

// =============================================================================
// TEAM PROFILES (staff/team member extended profiles)
// =============================================================================
// Final state includes columns from 020 + 022 (current_focus fields).

export const teamProfiles = pgTable('team_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Employment information
  position: text('position'),
  department: text('department'),
  // Values: employee, volunteer, intern, contractor
  employmentType: text('employment_type').default('volunteer'),
  startDate: date('start_date', { mode: 'string' }),
  contractHours: integer('contract_hours'),

  // Talent development
  skills: text('skills').array().default([]),
  interests: text('interests').array().default([]),
  goals: text('goals'),
  strengths: text('strengths'),
  developmentAreas: text('development_areas'),

  // Availability & contact
  availability: text('availability'),
  workingHours: text('working_hours'),
  // Values: email, phone, slack, or other
  preferredContact: text('preferred_contact').default('email'),
  phone: text('phone'),

  // Emergency contact
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  emergencyContactRelation: text('emergency_contact_relation'),

  // HR notes (restricted to super admins)
  hrNotes: text('hr_notes'),

  // Current focus (added by 022_activity_stream)
  currentFocus: text('current_focus'),
  currentFocusUpdatedAt: timestamp('current_focus_updated_at', { withTimezone: true, mode: 'string' }),

  // Status & timestamps
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_team_profiles_user_id').on(table.userId),
  index('idx_team_profiles_department').on(table.department),
  index('idx_team_profiles_employment_type').on(table.employmentType),
  index('idx_team_profiles_is_active').on(table.isActive),
  index('idx_team_profiles_skills').using('gin', table.skills),
  index('idx_team_profiles_current_focus').on(table.currentFocusUpdatedAt),
])

export type TeamProfile = typeof teamProfiles.$inferSelect
export type NewTeamProfile = typeof teamProfiles.$inferInsert

// =============================================================================
// STAFF PERMISSION REQUESTS (workflow for requesting admin section access)
// =============================================================================

export const staffPermissionRequests = pgTable('staff_permission_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestedSections: text('requested_sections').array().notNull(),
  reason: text('reason').notNull(),
  // Values: pending, approved, rejected
  status: text('status').notNull().default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_permission_requests_user_id').on(table.userId),
  index('idx_permission_requests_status').on(table.status),
  index('idx_permission_requests_reviewed_by').on(table.reviewedBy),
])

export type StaffPermissionRequest = typeof staffPermissionRequests.$inferSelect
export type NewStaffPermissionRequest = typeof staffPermissionRequests.$inferInsert

// =============================================================================
// ACTIVITY UPDATES (manual entries: accomplishments, milestones, notes)
// =============================================================================

export const activityUpdates = pgTable('activity_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // CHECK (update_type IN ('accomplishment', 'milestone', 'note', 'announcement')) — validated at app layer
  updateType: text('update_type').notNull().default('accomplishment'),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  // CHECK (visibility IN ('team', 'department', 'public')) — validated at app layer
  visibility: text('visibility').notNull().default('team'),
  occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_activity_updates_user').on(table.userId),
  index('idx_activity_updates_type').on(table.updateType),
  index('idx_activity_updates_occurred').on(table.occurredAt),
  index('idx_activity_updates_visibility').on(table.visibility),
  index('idx_activity_updates_category').on(table.category),
])

export type ActivityUpdate = typeof activityUpdates.$inferSelect
export type NewActivityUpdate = typeof activityUpdates.$inferInsert

// =============================================================================
// HELP REQUESTS (general, non-task help — broadcast or targeted)
// =============================================================================

export const helpRequests = pgTable('help_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requesterId: uuid('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  // CHECK (urgency IN ('low', 'normal', 'high', 'urgent')) — validated at app layer
  urgency: text('urgency').notNull().default('normal'),
  // NULL = broadcast to all staff
  requestedUserId: uuid('requested_user_id').references(() => users.id),
  // GENERATED ALWAYS AS (requested_user_id IS NULL) STORED — computed by PostgreSQL, read-only
  isBroadcast: boolean('is_broadcast').generatedAlwaysAs(sql`requested_user_id IS NULL`),
  // CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')) — validated at app layer
  status: text('status').notNull().default('open'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_help_requests_requester').on(table.requesterId),
  index('idx_help_requests_requested').on(table.requestedUserId),
  index('idx_help_requests_broadcast').on(table.isBroadcast),
  index('idx_help_requests_status').on(table.status),
  index('idx_help_requests_urgency').on(table.urgency),
  index('idx_help_requests_created').on(table.createdAt),
])

export type HelpRequest = typeof helpRequests.$inferSelect
export type NewHelpRequest = typeof helpRequests.$inferInsert

// =============================================================================
// USER CONTENT SUBMISSIONS (unified pending content requiring approval)
// =============================================================================

export const userContentSubmissions = pgTable('user_content_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Values: product, service, workshop, blog_post
  contentType: text('content_type').notNull(),
  contentId: uuid('content_id'),
  title: text('title').notNull(),
  summary: text('summary'),
  // Values: draft, pending, approved, rejected
  status: text('status').default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_user_content_submissions_user_id').on(table.userId),
  index('idx_user_content_submissions_status').on(table.status),
  index('idx_user_content_submissions_content_type').on(table.contentType),
])

export type UserContentSubmission = typeof userContentSubmissions.$inferSelect
export type NewUserContentSubmission = typeof userContentSubmissions.$inferInsert
