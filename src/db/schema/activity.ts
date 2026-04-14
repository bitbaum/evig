import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// ACTIVITY FEED (dashboard team feed)
// =============================================================================

export const activityFeed = pgTable('activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  subjectType: text('subject_type'),
  subjectId: text('subject_id'),
  subjectLabel: text('subject_label'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('idx_activity_feed_created').on(table.createdAt),
])

export type ActivityFeedEntry = typeof activityFeed.$inferSelect
export type NewActivityFeedEntry = typeof activityFeed.$inferInsert

// =============================================================================
// JOB RUNS (system health monitoring)
// =============================================================================

export const jobRuns = pgTable('job_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobName: text('job_name').notNull(),
  ranAt: timestamp('ran_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  success: boolean('success').notNull(),
  detail: text('detail'),
}, (table) => [
  index('idx_job_runs_name_ran_at').on(table.jobName, table.ranAt),
])

export type JobRun = typeof jobRuns.$inferSelect
export type NewJobRun = typeof jobRuns.$inferInsert
