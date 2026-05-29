import { pgTable, uuid, text, date, time, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { tasks } from './tasks'
import { meetingProtocols } from './protocols'

// =============================================================================
// TIMECARDS
// =============================================================================
// Staff work periods with review workflow.
// CHECK constraints on period_type and status are validated at app layer.

export const timecards = pgTable('timecards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Values: week, month
  periodType: text('period_type').notNull().default('week'),
  periodStart: date('period_start', { mode: 'string' }).notNull(),
  periodEnd: date('period_end', { mode: 'string' }).notNull(),
  // Values: draft, submitted, approved, rejected
  status: text('status').notNull().default('draft'),
  notes: text('notes'),
  submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  reviewNotes: text('review_notes'),
  // Phase 4 / Phase 5 (migration 080). Linked when a payroll batch closes;
  // rateAppliedCents is the snapshot of team_profiles.hourly_rate_cents at
  // close time so a later raise can't retroactively change historical math.
  payrollBatchId: uuid('payroll_batch_id'),
  rateAppliedCents: integer('rate_applied_cents'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  uniqueIndex('timecards_user_period_key').on(table.userId, table.periodStart, table.periodEnd),
  index('idx_timecards_user').on(table.userId),
  index('idx_timecards_status').on(table.status),
  index('idx_timecards_period').on(table.periodStart, table.periodEnd),
  index('idx_timecards_reviewed_by').on(table.reviewedBy),
  index('idx_timecards_payroll_batch').on(table.payrollBatchId),
])

export type Timecard = typeof timecards.$inferSelect
export type NewTimecard = typeof timecards.$inferInsert

// =============================================================================
// TIMECARD ENTRIES
// =============================================================================
// Individual work rows. Entries can optionally link to tasks or protocols so
// operational work can be reported once and reused in analytics.

export const timecardEntries = pgTable('timecard_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  timecardId: uuid('timecard_id').notNull().references(() => timecards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workDate: date('work_date', { mode: 'string' }).notNull(),
  startTime: time('start_time', { withTimezone: false }),
  endTime: time('end_time', { withTimezone: false }),
  breakMinutes: integer('break_minutes').notNull().default(0),
  durationMinutes: integer('duration_minutes').notNull(),
  // Values from TIMECARD_ENTRY_CATEGORIES
  category: text('category').notNull().default('other'),
  description: text('description'),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  protocolId: uuid('protocol_id').references(() => meetingProtocols.id, { onDelete: 'set null' }),
  // Values: manual, ai_assisted, template, task_completion
  source: text('source').notNull().default('manual'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_timecard_entries_timecard').on(table.timecardId),
  index('idx_timecard_entries_user_date').on(table.userId, table.workDate),
  index('idx_timecard_entries_category').on(table.category),
  index('idx_timecard_entries_task').on(table.taskId),
  index('idx_timecard_entries_protocol').on(table.protocolId),
])

export type TimecardEntry = typeof timecardEntries.$inferSelect
export type NewTimecardEntry = typeof timecardEntries.$inferInsert
