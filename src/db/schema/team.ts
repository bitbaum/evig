import { pgTable, uuid, text, boolean, timestamp, integer, date, numeric, index, check } from 'drizzle-orm/pg-core'
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

  // Compensation (added by migration 080).
  // hourlyRateCents + salaryChf coexist: hourly people have hourly_rate,
  // salaried people have salary_chf, some hybrids have both. The
  // compensation_history table is the source of truth for changes
  // over time; these columns hold the *current* values.
  hourlyRateCents: integer('hourly_rate_cents'),
  salaryChf: numeric('salary_chf', { precision: 10, scale: 2 }),
  salaryEffectiveDate: date('salary_effective_date', { mode: 'string' }),

  // Employment lifecycle (added by migration 080)
  endDate: date('end_date', { mode: 'string' }),
  exitReason: text('exit_reason'),

  // Swiss employment metadata (added by migration 080)
  ahvNumber: text('ahv_number'),
  cantonTaxCode: text('canton_tax_code'),

  // Explicit work-state machine (added by migration 080).
  // CHECK (work_state IN ('active', 'on_leave', 'unavailable', 'inactive'))
  // — validated at DB level. isActive (below) stays as the legacy boolean
  // shortcut; new code should prefer workState.
  workState: text('work_state').notNull().default('active'),

  // Zeiterfassung ledger (added by migration 136).
  // Opening Zeitsaldo carried over from the legacy SMALL-Time tool at
  // cutover ("Übertrag T") — punch-level history is NOT migrated.
  timeOpeningMinutes: integer('time_opening_minutes').notNull().default(0),
  timeOpeningDate: date('time_opening_date', { mode: 'string' }),
  // Day-of-month (1–28) for the personal "Zeiterfassung ausfüllen" reminder;
  // NULL = reminder off. CHECK team_profiles_reminder_day_range at DB level.
  zeiterfassungReminderDay: integer('zeiterfassung_reminder_day'),

  // Status & timestamps
  isActive: boolean('is_active').default(true),
  showOnAbout: boolean('show_on_about').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_team_profiles_user_id').on(table.userId),
  index('idx_team_profiles_department').on(table.department),
  index('idx_team_profiles_employment_type').on(table.employmentType),
  index('idx_team_profiles_is_active').on(table.isActive),
  index('idx_team_profiles_skills').using('gin', table.skills),
  index('idx_team_profiles_current_focus').on(table.currentFocusUpdatedAt),
  index('idx_team_profiles_work_state').on(table.workState),
  // Mirrors the CHECK added by migration 080 (team_profiles_work_state_valid).
  check(
    'team_profiles_work_state_valid',
    sql`${table.workState} IN ('active', 'on_leave', 'unavailable', 'inactive')`,
  ),
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

// =============================================================================
// COMPENSATION HISTORY (effective-dated rate / salary changes)
// =============================================================================
// Audit trail for hourly_rate + salary changes. Payroll uses this to
// answer "what rate applied to this person in May?" even after a later
// raise lands on team_profiles. ON DELETE RESTRICT on team_profile_id
// — financial-audit immutability, same rationale as payment_transactions.

export const compensationHistory = pgTable('compensation_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamProfileId: uuid('team_profile_id').notNull().references(() => teamProfiles.id, { onDelete: 'restrict' }),
  hourlyRateCents: integer('hourly_rate_cents'),
  salaryChf: numeric('salary_chf', { precision: 10, scale: 2 }),
  effectiveDate: date('effective_date', { mode: 'string' }).notNull(),
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_compensation_history_profile').on(table.teamProfileId, table.effectiveDate),
  // Mirrors migration 080's compensation_history_at_least_one_amount.
  check(
    'compensation_history_at_least_one_amount',
    sql`${table.hourlyRateCents} IS NOT NULL OR ${table.salaryChf} IS NOT NULL`,
  ),
  // Mirrors migration 080's compensation_history_amounts_non_negative.
  check(
    'compensation_history_amounts_non_negative',
    sql`(${table.hourlyRateCents} IS NULL OR ${table.hourlyRateCents} >= 0) AND (${table.salaryChf} IS NULL OR ${table.salaryChf} >= 0)`,
  ),
])

export type CompensationHistory = typeof compensationHistory.$inferSelect
export type NewCompensationHistory = typeof compensationHistory.$inferInsert

// =============================================================================
// LEAVE PERIODS (vacation / sick / parental / unpaid / military / other)
// =============================================================================
// Replaces the free-form `availability` text field. Kind values validated
// at DB level via CHECK constraint added by migration 080. ON DELETE
// CASCADE on team_profile_id — leave records are profile-scoped.

export const leavePeriods = pgTable('leave_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamProfileId: uuid('team_profile_id').notNull().references(() => teamProfiles.id, { onDelete: 'cascade' }),
  startsOn: date('starts_on', { mode: 'string' }).notNull(),
  endsOn: date('ends_on', { mode: 'string' }).notNull(),
  // CHECK (kind IN ('vacation', 'sick', 'parental', 'unpaid', 'military', 'other'))
  // — validated at DB level (constraint leave_periods_kind_valid).
  kind: text('kind').notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_leave_periods_profile_active').on(table.teamProfileId, table.startsOn, table.endsOn),
  // Mirrors migration 080's leave_periods_kind_valid.
  check(
    'leave_periods_kind_valid',
    sql`${table.kind} IN ('vacation', 'sick', 'parental', 'unpaid', 'military', 'other')`,
  ),
  // Mirrors migration 080's leave_periods_dates_ordered.
  check('leave_periods_dates_ordered', sql`${table.endsOn} >= ${table.startsOn}`),
])

// =============================================================================
// EMPLOYMENT PERIODS (effective-dated Pensum — migration 136)
// =============================================================================
// The Soll side of the Zeitsaldo. One row per Pensum change; Soll for any
// date resolves to the period with the latest valid_from <= date. Seeded
// from team_profiles.contract_hours (which stays as the "current" shortcut,
// mirroring the compensation_history pattern above).

export const employmentPeriods = pgTable('employment_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamProfileId: uuid('team_profile_id').notNull().references(() => teamProfiles.id, { onDelete: 'cascade' }),
  validFrom: date('valid_from', { mode: 'string' }).notNull(),
  // Weekly contracted working time in minutes (60% of a 40h week = 1440).
  weeklyMinutes: integer('weekly_minutes').notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_employment_periods_profile').on(table.teamProfileId, table.validFrom),
  check('employment_periods_weekly_minutes_range', sql`${table.weeklyMinutes} >= 0 AND ${table.weeklyMinutes} <= 6000`),
])

export type EmploymentPeriod = typeof employmentPeriods.$inferSelect
export type NewEmploymentPeriod = typeof employmentPeriods.$inferInsert

// =============================================================================
// VACATION ENTITLEMENTS (Ferienanspruch per person-year — migration 136)
// =============================================================================
// Feriensaldo = days + carryover_days − taken (ferien timecard entries of the
// year). carryover_days is the legacy tool's "Übertrag F" at cutover and the
// year-to-year carryover afterwards.

export const vacationEntitlements = pgTable('vacation_entitlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamProfileId: uuid('team_profile_id').notNull().references(() => teamProfiles.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  days: numeric('days', { precision: 4, scale: 1 }).notNull(),
  carryoverDays: numeric('carryover_days', { precision: 4, scale: 1 }).notNull().default('0'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_vacation_entitlements_profile').on(table.teamProfileId, table.year),
  check('vacation_entitlements_year_range', sql`${table.year} >= 2000 AND ${table.year} <= 2100`),
  check('vacation_entitlements_days_range', sql`${table.days} >= 0 AND ${table.days} <= 60`),
])

export type VacationEntitlement = typeof vacationEntitlements.$inferSelect
export type NewVacationEntitlement = typeof vacationEntitlements.$inferInsert

export type LeavePeriod = typeof leavePeriods.$inferSelect
export type NewLeavePeriod = typeof leavePeriods.$inferInsert

// =============================================================================
// PAYROLL BATCHES (Phase 5 scaffolding — monthly Lohnlauf close + export)
// =============================================================================
// Groups approved timecards into a "this month is closed for payroll"
// concept so accountant exports are reproducible and approved hours
// stop being editable once the batch is closed.

export const payrollBatches = pgTable('payroll_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodStart: date('period_start', { mode: 'string' }).notNull(),
  periodEnd: date('period_end', { mode: 'string' }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
  closedBy: uuid('closed_by').references(() => users.id, { onDelete: 'restrict' }),
  exportedAt: timestamp('exported_at', { withTimezone: true, mode: 'string' }),
  exportedBy: uuid('exported_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_payroll_batches_period').on(table.periodStart, table.periodEnd),
  // Mirrors migration 080's payroll_batches_dates_ordered.
  check('payroll_batches_dates_ordered', sql`${table.periodEnd} >= ${table.periodStart}`),
])

export type PayrollBatch = typeof payrollBatches.$inferSelect
export type NewPayrollBatch = typeof payrollBatches.$inferInsert
